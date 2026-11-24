import { getLegacyRedirectRules } from "./legacyRoutes";
import { getRetiredRedirectRules, renderRedirectRules, type RedirectRule } from "./retiredRoutes";

/** Every 301 of the production `_redirects`: the site's own retired URLs plus the reference/WordPress URLs. */
export function getHostRedirectRules(): RedirectRule[] {
  return [...getRetiredRedirectRules(), ...getLegacyRedirectRules()];
}

/** Production `_redirects` text: destinations are absolute URLs on the canonical origin (one hop on any host). */
export function renderHostRedirects(origin: string, base = ""): string {
  return renderRedirectRules(getHostRedirectRules(), base, origin);
}
