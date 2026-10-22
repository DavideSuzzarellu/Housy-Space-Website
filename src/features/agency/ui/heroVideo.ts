/**
 * Pure decisions for the home hero video (HomeHero.astro). The poster is the LCP image; the
 * video is progressive enhancement and is never downloaded when the visitor would not benefit.
 */

/** Network Information API `effectiveType` values where a multi-MB video is not worth it. */
const SLOW_CONNECTIONS: ReadonlySet<string> = new Set(["slow-2g", "2g"]);

export interface HeroVideoConditions {
  readonly reducedMotion: boolean;
  readonly saveData: boolean;
  /** `navigator.connection.effectiveType`; undefined where the API is unavailable. */
  readonly effectiveType: string | undefined;
}

export function shouldStreamHeroVideo({
  reducedMotion,
  saveData,
  effectiveType,
}: HeroVideoConditions): boolean {
  if (reducedMotion || saveData) return false;
  return effectiveType === undefined || !SLOW_CONNECTIONS.has(effectiveType);
}

export type HeroVideoSourceKey = "portraitWebm" | "portraitMp4" | "landscapeWebm" | "landscapeMp4";

/** `data-*` key of the source to play: small vertical cut on portrait viewports (phones). */
export function heroVideoSourceKey({
  portrait,
  webm,
}: {
  readonly portrait: boolean;
  readonly webm: boolean;
}): HeroVideoSourceKey {
  const orientation = portrait ? "portrait" : "landscape";
  return `${orientation}${webm ? "Webm" : "Mp4"}`;
}
