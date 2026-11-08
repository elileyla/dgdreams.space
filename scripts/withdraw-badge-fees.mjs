/**
 * Sweep collected mint fees out of the ChainBadge v3 contracts.
 *
 * Every badge contract keeps the quoted mint fees in its own balance
 * (owner-only, see ChainBadge.withdraw). This script walks the same chain
 * list as the deploy/set-fee tools, reads `feesCollected(address(0))` …
 * i.e. `feesCollected()` per chain, skips the empty ones, and pulls the
 * rest to the owner wallet.
 *
 *   node scripts/withdraw-badge-fees.mjs             # sweep every priced chain
 *   node scripts/withdraw-badge-fees.mjs --dry-run   # report only, sign nothing
 *   node scripts/withdraw-badge-fees.mjs --only 8453,999
 *   node scripts/withdraw-badge-fees.mjs --exclude 11155111
 *
 * The owner comes from DEPLOYER_PRIVATE_KEY (the address the badges were
 * deployed with) — only it can call `withdraw`. GenLayer (4221) is skipped:
 * its Python badge has no withdraw yet, fees there sit in the contract.
 */
import { readFileSync, existsSync } from "node:fs";
import {
  createWalletClient,
  createPublicClient,
  fallback,
  http,
  parseAbi,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnetNetworks, testnetNetworks } from "../src/config/chains.ts";

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valuesOf = (f) =>
  argv.reduce((acc, a, i) => (a === f ? [...acc, argv[i + 1]] : acc), []);

const dryRun = has("--dry-run");
const only = valuesOf("--only").flatMap((v) => v.split(",")).filter(Boolean);
const excluded = valuesOf("--exclude").flatMap((v) => v.split(",")).filter(Boolean);

const ABI = parseAbi([
  "function withdraw(address to) returns (uint256)",
  "function feesCollected() view returns (uint256)",
]);

/** Read the deployed badge address out of src/lib/badge.ts (deploy script's trick). */
function badgeAddress(chainId) {
  const src = readFileSync("src/lib/badge.ts", "utf8");
  const m = src.match(new RegExp(`\\b${chainId}\\s*:\\s*"(0x[0-9a-fA-F]{40})"`));
  return m ? m[1] : undefined;
}

function loadPrivateKey() {
  if (process.env.DEPLOYER_PRIVATE_KEY) {
    return process.env.DEPLOYER_PRIVATE_KEY.trim().replace(/^0x/, "");
  }
  if (existsSync(".env.local")) {
    const m = readFileSync(".env.local", "utf8").match(
      /^\s*DEPLOYER_PRIVATE_KEY\s*=\s*["']?([0-9a-fA-Fx]+)["']?\s*$/m
    );
    if (m) return m[1].replace(/0x/, "");
  }
  throw new Error(
    "No DEPLOYER_PRIVATE_KEY found. Add it to .env.local as DEPLOYER_PRIVATE_KEY=0x..."
  );
}

// GenLayer (4221) is a Python contract without withdraw — out of scope here.
const NETWORKS = [...mainnetNetworks, ...testnetNetworks];
const TARGETS = NETWORKS.filter(
  (n) =>
    String(n.id) !== "4221" &&
    (only.length === 0 || only.includes(String(n.id))) &&
    !excluded.includes(String(n.id))
).map((n) => ({ id: n.id, name: n.name, net: n }));

const account = privateKeyToAccount(`0x${loadPrivateKey()}`);

console.log(`Sweeping to: ${account.address}`);
console.log(`Mode:        ${dryRun ? "DRY RUN — nothing is signed or sent" : "LIVE"}`);
console.log("");

const results = [];
let totalRequested = 0n;

for (const target of TARGETS) {
  const { net, id, name } = target;
  const transport = fallback(net.rpcUrls.default.http.map((url) => http(url)));
  const publicClient = createPublicClient({ transport });
  const wallet = createWalletClient({ account, chain: null, transport });

  try {
    const contract = badgeAddress(id);
    if (!contract) {
      results.push({ id, name, error: "no badge deployed" });
      continue;
    }

    let collected;
    try {
      collected = await publicClient.readContract({
        address: contract,
        abi: ABI,
        functionName: "feesCollected",
      });
    } catch {
      // Older badges (v2 and earlier) have no feesCollected — not ours, skip.
      results.push({ id, name, error: "not a fee-aware (v3) badge — skipped" });
      continue;
    }
    totalRequested += collected;
    if (collected === 0n) {
      console.log(`── ${name} (${id}) — fees 0, nothing to sweep`);
      results.push({ id, name, address: contract, swept: 0n });
      continue;
    }

    console.log(
      `── ${name} (${id}) — ${formatEther(collected)} ${net.nativeCurrency.symbol} waiting on ${contract}${dryRun ? " (dry run)" : ""}`
    );
    if (dryRun) {
      results.push({ id, name, address: contract, swept: collected });
      continue;
    }

    // withdraw(address) — cast sig gives the exact selector, no hand-hash risks.
    const selector = "0x51cff8d9";
    const padded = account.address.replace("0x", "").padStart(64, "0").toLowerCase();
    const data = `${selector}${padded}`;

    const nonce = await publicClient.getTransactionCount({ address: account.address });
    // Estimate first and pad 50% — several chains inflate gas accounting,
    // and a fixed cap reverts OOG (the same lesson the deploy/set-fee runs).
    const gasMany = await publicClient.estimateGas({
      account: account.address,
      to: contract,
      data,
    });

    const hash = await wallet.writeContract({
      address: contract,
      abi: ABI,
      functionName: "withdraw",
      args: [account.address],
      chain: null,
      gas: (gasMany * 150n) / 100n,
      nonce,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`tx ${hash} reverted`);
    console.log(`    ✓ swept — tx ${hash}`);
    results.push({ id, name, address: contract, swept: collected });
  } catch (e) {
    const detail = String(e?.details || e?.shortMessage || e).split("\n")[0];
    console.error(`── ${name} (${id}) — x ${detail}`);
    results.push({ id, name, error: detail });
  }
}

console.log("");
const ok = results.filter((r) => r.address);
const failed = results.filter((r) => !r.address);
console.log(
  `Done: ${ok.length}/${TARGETS.length} chains touched, ${formatEther(totalRequested)} tokens (18-dec) requested in fees total.`
);
if (failed.length) {
  console.log("Skipped/failed:");
  for (const r of failed) console.log(`  · ${r.name} (${r.id}): ${r.error}`);
}
