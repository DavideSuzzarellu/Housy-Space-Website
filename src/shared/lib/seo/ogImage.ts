import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";

/** Open Graph card size recommended by Facebook, LinkedIn and X (1.91:1). */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/**
 * Root-relative URL (with the site base) of a project photo cropped to the Open Graph card size
 * and encoded as JPEG, which every crawler reads. Pages without a photo keep the PNG logo.
 */
export async function getOgImagePath(source: ImageMetadata): Promise<string> {
  const image = await getImage({ src: source, ...OG_IMAGE_SIZE, fit: "cover", format: "jpeg" });
  return image.src;
}
