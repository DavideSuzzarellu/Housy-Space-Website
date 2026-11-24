import type { APIRoute } from "astro";
import { renderRobotsTxt } from "@/shared/lib/seo/robotsTxt";
import { getSiteUrl } from "@/shared/lib/seo/structuredData";

// Built from `site` + `base` so the sitemap line always matches the deployed URL (no hardcoded host).
export const GET: APIRoute = ({ site }) => {
  if (site === undefined) return new Response("Missing `site` in astro.config", { status: 500 });
  return new Response(renderRobotsTxt(getSiteUrl(site, import.meta.env.BASE_URL)), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
