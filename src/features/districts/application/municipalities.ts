import { getEntry } from "astro:content";
import type { MunicipalitiesData } from "@/features/districts/infrastructure/municipalitySchema";

/** Municipalities of the province of Barcelona, sorted by name (AGENTS.md §6 item 20). */
export async function getMunicipalities(): Promise<MunicipalitiesData> {
  const entry = await getEntry("municipalities", "barcelona-province");
  if (entry === undefined) throw new Error("Missing municipality data");
  return entry.data;
}
