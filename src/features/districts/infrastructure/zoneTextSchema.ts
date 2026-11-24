import { z } from "astro/zod";
import type { Locale } from "@/shared/i18n/config";

/**
 * Prose of a district or a barrio, one file per locale, kind and slug:
 * `src/content/market/text/{locale}/{districts|barrios}/{slug}.json`. The same strict shape for every locale; figures
 * live in `barcelona.json`, never here (names are official Spanish/Catalan, never translated).
 * `translated: false` marks a file that still holds Spanish copy: the site then shows the
 * Spanish source, marked `lang="es"`. A translator sets it to `true` when the file is done.
 */
const base = { translated: z.boolean(), lead: z.string().min(1) };

export const districtTextSchema = z
  .object({
    kind: z.literal("district"),
    ...base,
    history: z.array(z.string().min(1)).min(1),
    summary: z.string().min(1),
    landmarks: z.array(
      z
        .object({ name: z.string().min(1), where: z.string().min(1), text: z.string().min(1) })
        .strict(),
    ),
  })
  .strict();

export const barrioTextSchema = z
  .object({
    kind: z.literal("barrio"),
    ...base,
    text: z.array(z.string().min(1)).min(1),
    housing: z.string().min(1),
    places: z.array(z.string().min(1)),
  })
  .strict();

export const zoneTextSchema = z.discriminatedUnion("kind", [districtTextSchema, barrioTextSchema]);

export type DistrictText = z.infer<typeof districtTextSchema>;
export type BarrioText = z.infer<typeof barrioTextSchema>;
export type ZoneText = z.infer<typeof zoneTextSchema>;

export type ZoneKind = ZoneText["kind"];

/** Id of a prose file (and of its `marketText` entry): `{locale}/{districts|barrios}/{slug}`. Separate folders: two slugs collide (`les-corts`, `sant-andreu`). */
export function zoneTextId(locale: Locale, kind: ZoneKind, slug: string): string {
  return `${locale}/${kind}s/${slug}`;
}
