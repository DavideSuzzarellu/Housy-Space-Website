import type { ImageOutputFormat } from "astro";

/**
 * Shared `<Picture />` output for every photo (AGENTS.md §8 performance): AVIF `<source>` first
 * (roughly half the bytes of WebP at the same visual quality), WebP `<img>` fallback.
 * `display: contents` keeps the `<picture>` wrapper out of layout, so the sizing classes on the
 * `<img>` (`size-full`, `absolute inset-0`...) behave exactly as with `<Image />`.
 * Spread it into every `<Picture />`: `<Picture {...PHOTO_PICTURE} src=... />`.
 */
export const PHOTO_PICTURE: {
  readonly formats: ImageOutputFormat[];
  readonly fallbackFormat: ImageOutputFormat;
  readonly pictureAttributes: { readonly class: string };
} = {
  formats: ["avif"],
  fallbackFormat: "webp",
  pictureAttributes: { class: "contents" },
};
