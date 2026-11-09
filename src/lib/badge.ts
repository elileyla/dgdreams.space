import type { NetworkConfig } from "@/config/chains";

/**
 * The Grand Tour badge — free, soulbound NFTs per network.
 *
 * ChainBadge is deployed on every network the app supports (see
 * scripts/deploy-badges.mjs), with the network's name in the contract itself.
 * Pricing, per chain and per UTC day: the wallet's first mint of the day is
 * free (gas only), the second costs the chain's `baseFee` rate — the "1 cent"
 * the owner sets with setBadgeFee — and every extra mint doubles from there.
 * The badge can never leave that wallet. The metadata comes from the app's
 * /api/badge route, which serves the network's own logo as the image.
 *
 * The ABI carries the v3 pricing reads (nextMintPrice, mintsToday). Against
 * still-deployed v2 contracts those calls revert — the gallery cards treat
 * that as "legacy: unlimited free" and mint with value 0.
 *
 * The addresses live here so the gallery and any future page read the same
 * contract. A "" means "not deployed on this network yet" — the deploy script
 * fills rows in place (never appends duplicates).
 */
export const BADGE_ADDR: Record<number, `0x${string}` | ""> = {
  1: "", 8453: "0xaea7dd11af048047b210fa8830fba795f6eccfea", 999: "0xe44e88f432ce74e3522a024ff5ed2c8393da93f9", 130: "0xaf928e2ed9fcfed28a5a037044cec138b1bb7041", 4217: "0xeffc9f6951208d49afe1b9b9c8b98229a24be8bc", 4663: "0x672828daa4652c87117a3f91f3cb7c80afd218c3", 57073: "0xcae44211a544e9316c28c2a849ea176cddf8dfc8",
  5042: "0x58420b248ef127c796992c04cabf123a72bcd1b3", 56: "0xc288b68022e752d97e4395ecba61c2079ce692ad", 204: "0xff3a00cf7d83723f88097bcc8230ae37b3adf3ff", 42161: "0xc288b68022e752d97e4395ecba61c2079ce692ad", 10: "0x6e17e98ff56b12886636fa9ea3c17e0cd01d9790", 1868: "0x6e17e98ff56b12886636fa9ea3c17e0cd01d9790",
  91342: "0xcb1b3a864d384d5ad42b6f5b81825ab084444d9c", 4441: "0x76423ec7eaad5fdb349e6d77d760b28830436561",
  1913: "0xd3e31c08423a537b4d0e108971dc715daaab4893", 4221: "0x8A32da709dA16DF8c7039dA22d0688a6817587E4", 450815: "0xeffc9f6951208d49afe1b9b9c8b98229a24be8bc",
  6281971: "0x12d6cfc9659c613dae006072cf9f5524bf60055d",
  99801: "0xff3a00cf7d83723f88097bcc8230ae37b3adf3ff",
  1440000: "0xc288b68022e752d97e4395ecba61c2079ce692ad",
  99901: "0xdbee9ea39fedd197d224ea7520a20b4434635a6a",
};

export const BADGE_ABI = [
  { inputs: [], name: "mint", outputs: [{ name: "", type: "uint256" }], stateMutability: "payable", type: "function" },
  {
    inputs: [{ name: "count", type: "uint256" }],
    name: "mintBatch",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "nextMintPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "mintsToday",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "baseFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "userTokenId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "mintCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "totalMinted", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "weiPerFirstPaidMint", type: "uint256" }], name: "setBaseFee", outputs: [], stateMutability: "nonpayable", type: "function" },
] as const;

/** The badge address for a network, if one is deployed there. */
export function badgeAddress(
  network: NetworkConfig | undefined
): `0x${string}` | undefined {
  if (!network) return undefined;
  const addr = BADGE_ADDR[network.id];
  return addr && addr.length > 0 ? addr : undefined;
}

/**
 * Grand Tour artwork (`/public/output-premium`), per chain. Several chains
 * share the logo of their sibling (GIWA Sepolia wears the Ethereum mark,
 * and so on). Anything not listed falls back to the network's own `logo`
 * from the network config.
 */
export const BADGE_IMAGE: Record<number, string> = {
  1: "/output-premium/ethereum.png",
  8453: "/output-premium/base.png",
  999: "/output-premium/hyperliquid.png",
  130: "/output-premium/unichain.png",
  4217: "/output-premium/tempo.png",
  4663: "/output-premium/robinhood.png",
  57073: "/output-premium/ink.png",
  5042: "/output-premium/arc.png",
  56: "/output-premium/bnb-chain.png",
  204: "/output-premium/opbnb.png",
  42161: "/output-premium/arbitrum.png",
  10: "/output-premium/optimism.png",
  1868: "/output-premium/soneium.png",
  91342: "/output-premium/giwa.png",
  4441: "/output-premium/litvm.png",
  1913: "/output-premium/simplechain.png",
  4221: "/output-premium/genlayer.png",
  450815: "/output-premium/maroo.png",
  6281971: "/output-premium/dogeos.png",
  99801: "/output-premium/elysium.png",
  99901: "/output-premium/elysium.png",
  1440000: "/output-premium/xrplevm.png",
};

/** Absolute-able image path for a network's badge. */
export function badgeImage(network: NetworkConfig | undefined): string {
  if (!network) return "";
  return BADGE_IMAGE[network.id] ?? network.logo;
}
