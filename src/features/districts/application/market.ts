import { getEntry } from "astro:content";
import type { MarketData } from "@/features/districts/infrastructure/marketSchema";

export async function getMarket(): Promise<MarketData> {
  const entry = await getEntry("market", "barcelona");
  if (entry === undefined) throw new Error("Missing market data");
  return entry.data;
}
