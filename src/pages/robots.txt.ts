import type { APIRoute } from "astro";
import { isIndexableSite } from "@/shared/lib/seo/indexability";
import { renderBlockedRobotsTxt, renderRobotsTxt } from "@/shared/lib/seo/robotsTxt";
import { getSiteUrl } from "@/shared/lib/seo/structuredData";

// Built from `site` + `base` so the sitemap line always matches the deployed URL (no hardcoded host).
// Any site that is not the production origin (staging, previews) is blocked entirely.
export const GET: APIRoute = ({ site }) => {
  if (site === undefined) return new Response("Missing `site` in astro.config", { status: 500 });
  const body = isIndexableSite(site)
    ? renderRobotsTxt(getSiteUrl(site, import.meta.env.BASE_URL))
    : renderBlockedRobotsTxt();
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
