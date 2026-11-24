import type { APIRoute } from "astro";
import { buildWebManifest } from "@/shared/lib/seo/webManifest";

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildWebManifest(import.meta.env.BASE_URL), null, 2), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
