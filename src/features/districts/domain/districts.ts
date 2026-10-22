import { slugify } from "@/shared/lib/slugify";

/**
 * The 10 districts of Barcelona with their official (Catalan) names and number of barrios
 * (Ajuntament de Barcelona administrative division: 73 barrios). Names are never translated
 * (AGENTS.md §4.1); slugs are the ASCII-slugified official names.
 */
export interface District {
  readonly slug: string;
  readonly name: string;
  readonly barrioCount: number;
}

const OFFICIAL_DISTRICTS = [
  { name: "Ciutat Vella", barrioCount: 4 },
  { name: "Eixample", barrioCount: 6 },
  { name: "Sants-Montjuïc", barrioCount: 8 },
  { name: "Les Corts", barrioCount: 3 },
  { name: "Sarrià-Sant Gervasi", barrioCount: 6 },
  { name: "Gràcia", barrioCount: 5 },
  { name: "Horta-Guinardó", barrioCount: 11 },
  { name: "Nou Barris", barrioCount: 13 },
  { name: "Sant Andreu", barrioCount: 7 },
  { name: "Sant Martí", barrioCount: 10 },
] as const;

export const DISTRICTS: readonly District[] = OFFICIAL_DISTRICTS.map((district) => ({
  ...district,
  slug: slugify(district.name),
}));

export function getDistrict(slug: string): District | undefined {
  return DISTRICTS.find((district) => district.slug === slug);
}
