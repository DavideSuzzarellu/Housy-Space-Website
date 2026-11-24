import type { Dictionary } from "@/shared/i18n";
import { formatMessage } from "@/shared/lib/format";

/** Title and description of a zone page; the text comes from the dictionary and the zone's own prose. */
export interface ZoneMeta {
  readonly title: string;
  readonly description: string;
}

type ZoneDictionary = Dictionary["zones"];

/** Official names start with a capital article (`El Raval`); mid-sentence Spanish writes it small. */
const LEADING_ARTICLE = /^(El|La|Les|Els|Los|Las) |^L'/;

export function lowerLeadingArticle(name: string): string {
  return name.replace(LEADING_ARTICLE, (article) => article.toLowerCase());
}

/** `lead` is the zone's one-sentence summary from the market prose (never invented here). */
export function districtMeta(
  zones: ZoneDictionary,
  district: { readonly name: string; readonly lead: string },
): ZoneMeta {
  return {
    title: formatMessage(zones.districtMetaTitle, { name: district.name }),
    description: `${district.lead} ${zones.districtMetaSuffix}`,
  };
}

export function barrioMeta(
  zones: ZoneDictionary,
  barrio: { readonly name: string; readonly district: string; readonly lead: string },
): ZoneMeta {
  return {
    title: formatMessage(zones.barrioMetaTitle, {
      name: barrio.name,
      nameInSentence: lowerLeadingArticle(barrio.name),
      district: barrio.district,
    }),
    description: `${barrio.lead} ${zones.barrioMetaSuffix}`,
  };
}
