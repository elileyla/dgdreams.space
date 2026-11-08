"use client";

import type { Hash } from "genlayer-js/types";
import { getGenLayerReadClient, getGenLayerWriteClient } from "./client";
import { waitForGenLayerTx } from "./tasks";

export const GENLAYER_BADGE_CONTRACT = "0x8A32da709dA16DF8c7039dA22d0688a6817587E4" as `0x${string}`;

/**
 * Price of the caller's next mint on GenLayer, in wei (0 = free — the day's
 * free mint is still available). Returns `null` when the deployed badge is
 * the pre-pricing edition, which has no `nextMintPrice` — the card then runs
 * in legacy mode: unlimited, free, gas only.
 */
export async function genBadgeNextPrice(address: `0x${string}`): Promise<number | null> {
  const client = getGenLayerReadClient();
  try {
    const result = await client.readContract({
      address: GENLAYER_BADGE_CONTRACT,
      functionName: "nextMintPrice",
      args: [address],
    });
    return Number(String(result));
  } catch {
    return null;
  }
}

/** Mints this wallet has already made today (for the "free used" chip). May be null on legacy. */
export async function genBadgeMintsToday(address: `0x${string}`): Promise<number | null> {
  const client = getGenLayerReadClient();
  try {
    const result = await client.readContract({
      address: GENLAYER_BADGE_CONTRACT,
      functionName: "mintsToday",
      args: [address],
    });
    return Number(String(result));
  } catch {
    return null;
  }
}

export async function genBadgeMint(
  address: `0x${string}`,
  value: bigint
): Promise<{ hash: string }> {
  const client = getGenLayerWriteClient(address);
  if (!client) throw new Error("GenLayer wallet not connected");

  const hash = (await client.writeContract({
    address: GENLAYER_BADGE_CONTRACT,
    functionName: "mint",
    args: [],
    value,
  })) as unknown as Hash;

  return { hash: hash as unknown as string };
}

export async function genBadgeMintCount(address: `0x${string}`): Promise<number> {
  const client = getGenLayerReadClient();
  const result = await client.readContract({
    address: GENLAYER_BADGE_CONTRACT,
    functionName: "mintCount",
    args: [address],
  });
  return Number(String(result));
}

export async function genBadgeUserTokenId(address: `0x${string}`): Promise<number> {
  const client = getGenLayerReadClient();
  const result = await client.readContract({
    address: GENLAYER_BADGE_CONTRACT,
    functionName: "userTokenId",
    args: [address],
  });
  return Number(String(result));
}

export async function genBadgeTotalMinted(): Promise<number> {
  const client = getGenLayerReadClient();
  const result = await client.readContract({
    address: GENLAYER_BADGE_CONTRACT,
    functionName: "totalMinted",
    args: [],
  });
  return Number(String(result));
}

export { waitForGenLayerTx };
