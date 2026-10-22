/**
 * Mobilia Public API v1 (AGENTS.md §5). The spec declares no `servers` entry;
 * this base URL was confirmed with a live token request.
 */
export const MOBILIA_BASE_URL = "https://api.mobiliagestion.es";

/** Spec maximum for `TamanoPagina`; larger values are silently capped by the API. */
export const MOBILIA_MAX_PAGE_SIZE = 100;

/** Renew the token this long before `expires_in` runs out. */
export const TOKEN_SAFETY_MARGIN_MS = 60_000;

/** Hard stop for pagination in case `totalElementos` is inconsistent. */
export const MOBILIA_MAX_PAGES = 500;

/** Host serving listing photos; must match `image.remotePatterns` in astro.config.ts. */
export const MOBILIA_MEDIA_HOST = "media.mobiliagestion.es";
