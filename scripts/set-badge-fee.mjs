/**
 * Set the "1 cent" rate (baseFee) the ChainBadge v3 charges for a wallet's
 * second mint of a day, per network:
 *
 *   node scripts/set-badge-fee.mjs --fee 10000000000000000 --only 8453,42161
 *
 * --fee is wei of each chain's native token. Every extra mint doubles from
 * there (2nd = fee, 3rd = 2×, 4th = 4×…) and each wallet's first mint of the
 * UTC day stays free. Setting --fee 0 makes every mint free again.
 *
 * Flags (same recipe as deploy-badges.mjs):
 *   --fee <wei>   the rate to set (required unless --dry-run)
 *   --dry-run     show what would be sent on each chain, sign nothing
 *   --only <ids>  restrict to chain ids, comma list
 *   --exclude <ids>
 *
 * GenLayer (4221) is skipped — its badge is a Python contract, its fee is set
 * with badge_genlayer.py's setBaseFee (owner key, one call).
 */
import { readFileSync, existsSync } from "node:fs";
import { createWalletClient, createPublicClient, fallback, http, parseAbi, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnetNetworks, testnetNetworks } from "../src/config/chains.ts";

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valuesOf = (f) =>
  argv.reduce((acc, a, i) => (a === f ? [...acc, argv[i + 1]] : acc), []);

const dryRun = has("--dry-run");
const only = valuesOf("--only").flatMap((v) => v.split(",")).filter(Boolean);
const excluded = valuesOf("--exclude").flatMap((v) => v.split(",")).filter(Boolean);

const feeText = valuesOf("--fee")[0];
if (feeText === undefined && !dryRun) {
  console.error("✗ pass --fee <wei> (and optionally --only/--exclude), or --dry-run");
  process.exit(1);
}
const fee = feeText !== undefined ? BigInt(feeText) : 0n;

const BADGE_ADDR_FILE = "src/lib/badge.ts";
const ABI = parseAbi(["function setBaseFee(uint256 weiPerFirstPaidMint)"]);

/** Read the deployed addresses out of src/lib/badge.ts the same way the deploy script does. */
function badgeAddress(chainId) {
  const src = readFileSync(BADGE_ADDR_FILE, "utf8");
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

// GenLayer is a Python-Intelligent-Contract chain — see badge_genlayer.py.
const NETWORKS = [...mainnetNetworks, ...testnetNetworks];
const TARGETS = NETWORKS.filter(
  (n) =>
    String(n.id) !== "4221" && // GenLayer: Python contract, set its fee via setBaseFee() there
    (only.length === 0 || only.includes(String(n.id))) &&
    !excluded.includes(String(n.id))
).map((n) => ({ id: n.id, name: n.name, net: n }));

const account = privateKeyToAccount(`0x${loadPrivateKey()}`);

console.log(`Setter:   ${account.address}`);
console.log(`Rate:     ${fee} wei/second-mint${fee === 0n ? " (every mint free)" : ""}`);
console.log(`Mode:     ${dryRun ? "DRY RUN — nothing is signed or sent" : "LIVE"}`);
if (only.length) console.log(`Only:     ${only.join(", ")}`);
if (excluded.length) console.log(`Excluded: ${excluded.join(", ")}`);
console.log("");

const results = [];

for (const target of TARGETS) {
  const { net, id, name } = target;
  const transport = fallback(net.rpcUrls.default.http.map((url) => http(url)));
  const publicClient = createPublicClient({ transport });
  const wallet = createWalletClient({ account, chain: null, transport });

  console.log(`── ${name} (chain ${id}) ──`);

  try {
    const contract = badgeAddress(id);
    if (!contract) {
      console.log("  · no badge deployed here yet (skipped)");
      results.push({ id, name, error: "not deployed" });
      continue;
    }

    if (dryRun) {
      console.log(`  ~ setBaseFee(${fee}) → ${contract}`);
      results.push({ id, name, address: contract });
      continue;
    }

    const nonce = await publicClient.getTransactionCount({ address: account.address });
    // Estimate the gas instead of hardcoding it — several chains (Sepolia,
    // Tempo…) inflate gas accounting several×, and a fixed cap reverts OOG.
    const gasMany = await publicClient.estimateGas({
      account: account.address,
      to: contract,
      data: encodeFunctionData({ abi: ABI, functionName: "setBaseFee", args: [fee] }),
    });
    const hash = await wallet.writeContract({
      address: contract,
      abi: ABI,
      functionName: "setBaseFee",
      args: [fee],
      chain: null,
      gas: (gasMany * 150n) / 100n,
      nonce,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`tx ${hash} reverted`);
    console.log(`  v setBaseFee(${fee}) → ${contract}`);
    console.log(`    tx ${hash}`);
    results.push({ id, name, address: contract });
  } catch (e) {
    const detail = String(e?.details || e?.shortMessage || e).split("\n")[0];
    console.error(`  x ${name}: ${detail}`);
    results.push({ id, name, error: detail });
  }
}

const ok = results.filter((r) => r.address);
const failed = results.filter((r) => !r.address);
console.log(`\nSet on ${ok.length}/${TARGETS.length} chains.`);
if (failed.length) {
  console.log("Skipped/failed:");
  for (const r of failed) console.log(`  · ${r.name} (${r.id}): ${r.error}`);
}
