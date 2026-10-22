# Performance

Target (AGENTS.md §8): Lighthouse mobile ≥ 90, LCP < 2.5 s, no layout shift.

## Baseline vs after

Lighthouse 13.5.0, mobile preset (simulated throttling), production build served by
`astro preview`. Each figure is the median of 3 runs. Transfer sizes come from the preview
server's compression, which is weaker than a CDN's brotli.

| Page                                                                | Run      | Score | LCP    | CLS | TBT  | FCP    | Speed Index | Total    | JS   | Images | CSS   | Requests |
| ------------------------------------------------------------------- | -------- | ----- | ------ | --- | ---- | ------ | ----------- | -------- | ---- | ------ | ----- | -------- |
| `/es` (home)                                                        | Baseline | 96    | 2.79 s | 0   | 0 ms | 1.22 s | 1.22 s      | 2621 KB¹ | 6 KB | 496 KB | 13 KB | 17       |
| `/es` (home)                                                        | After    | 99    | 2.11 s | 0   | 0 ms | 1.36 s | 1.36 s      | 2367 KB¹ | 6 KB | 242 KB | 13 KB | 17       |
| `/es/venta/piso-en-venta-en-barcelona-1001` (sale)                  | Baseline | 94    | 3.06 s | 0   | 0 ms | 1.51 s | 1.51 s      | 374 KB   | 8 KB | 242 KB | 20 KB | 12       |
| `/es/venta/piso-en-venta-en-barcelona-1001` (sale)                  | After    | 98    | 2.41 s | 0   | 0 ms | 1.06 s | 1.06 s      | 220 KB   | 8 KB | 93 KB  | 13 KB | 11       |
| `/es/alquiler/local-comercial-en-alquiler-en-barcelona-1004` (rent) | Baseline | 99    | 2.12 s | 0   | 0 ms | 1.37 s | 1.37 s      | 183 KB   | 8 KB | 53 KB  | 20 KB | 12       |
| `/es/alquiler/local-comercial-en-alquiler-en-barcelona-1004` (rent) | After    | 100   | 1.82 s | 0   | 0 ms | 1.06 s | 1.06 s      | 152 KB   | 8 KB | 29 KB  | 13 KB | 11       |

¹ About 2000 KB of the home total is the hero video (`hero-720v.webm` on a phone). After this
pass it starts only after the `load` event plus an idle period, so it no longer competes with
the critical path. Lighthouse still counts it because the trace keeps recording after load.

The home LCP element is the hero media-credit text, not the poster. Chrome leaves
full-viewport images out of LCP, so the poster never becomes the candidate. The home LCP
therefore depends on how many bytes are requested before first paint, which is why making the
images below the fold smaller (AVIF, accurate `sizes`) lowered it.

## What was optimized and why

| Area   | Change                                                                                                                                                                                                                                                                               | Why                                                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Images | Every photo uses `<Picture {...PHOTO_PICTURE}>` (`src/shared/lib/images.ts`): AVIF `<source>` and a WebP `<img>`. `display: contents` on `<picture>` keeps the layout identical.                                                                                                     | AVIF is about 40–60 % smaller than WebP. Sale LCP image: 232 KB → 80 KB.                                                                                                  |
| Images | Gallery hero adds a 828w candidate. Home cards use `calc(100vw - 2.75rem)` (container gutters) and add 640w candidates.                                                                                                                                                              | Phones at DPR 1.75 (about 720 device px) were getting the 1000w file.                                                                                                     |
| Images | Only the LCP image is eager with `fetchpriority="high"` (gallery hero `priority`, home poster). Everything else is lazy with `decoding="async"`, and every image has `width`/`height`. Enforced by the e2e budget.                                                                   | Keeps bandwidth for the LCP image. Prevents CLS.                                                                                                                          |
| Hero   | Poster gets AVIF sources (portrait and landscape). The video starts after `load` and `requestIdleCallback`. It is skipped under reduced motion, Save-Data or 2G (`features/agency/ui/heroVideo.ts`). Phones use the 720 px vertical cut.                                             | The poster renders immediately. The 2–3 MB video never delays it and is never downloaded when the visitor would not benefit.                                              |
| CSS    | Leaflet CSS is loaded with `?url` and injected with Leaflet JS when the map nears the viewport.                                                                                                                                                                                      | Removed a 15 KB render-blocking stylesheet from every detail page.                                                                                                        |
| Fonts  | Only the weights in use (Montserrat 400/500, Cormorant Garamond 400 normal). `latin` + `latin-ext` subsets: latin-ext only downloads when a page contains those glyphs (unicode-range). Only latin files are preloaded. Serif preload is per page (`preloadSerif`, off on the home). | Fewer `@font-face` rules and no preload competing with the home poster. Fallbacks stay size-adjusted (Astro Fonts API `optimizedFallbacks`) and use `font-display: swap`. |
| JS     | Audited: about 6 KB compressed on first load (ClientRouter plus small inline modules). Leaflet (149 KB raw) loads only on map visibility (verified by e2e).                                                                                                                          | Zero TBT.                                                                                                                                                                 |
| Nav    | Property cards use `data-astro-prefetch="viewport"`. Other links keep ClientRouter's default (`prefetchAll`, hover).                                                                                                                                                                 | Phones have no hover, so card → detail HTML is prefetched when the card is visible. Astro skips prefetch with Save-Data or on slow connections.                           |

Kept on purpose:

- **`build.inlineStylesheets`** stays at the default (`auto`). The shared stylesheet is 74 KB raw / 13 KB gzip. Inlining it would remove one render-blocking request but add those bytes to every HTML page, including ClientRouter navigations, and it would no longer be cacheable.
- **HTML.** Astro 7 already strips whitespace (`compressHTML: "jsx"`). Pages are about 115–125 KB raw / 17–18 KB gzip, with no large inline data. About 21 KB raw comes from the per-element `transition:animate={morph}` style blocks. These are highly repetitive (about 2 KB compressed), so they were left alone.
- **Third parties.** None load on first load (enforced by e2e). The ICGC map tiles load only after the map is scrolled into view. They are functional and set no cookies.

## Performance budget (automated)

`tests/e2e/performance.spec.ts` runs with `pnpm test:e2e` against the production build. It uses a phone viewport and no extra dependencies: Resource Timing, LCP and Layout Shift observers. It checks:

- Initial-load encoded bytes: total, JS and images. It also checks font file count and request count.
- LCP < 2.5 s and CLS < 0.1. These are local, unthrottled sanity limits; Lighthouse is the real gate.
- The first load is first-party only.
- Image loading rules (one eager LCP image, the rest lazy/async/sized).
- Leaflet is not requested before the map is visible.
- The hero video never loads before `load`, and never loads under reduced motion or Save-Data.

Budgets have about 25 % headroom over the measured values: home 520 KB total / 380 KB images, detail 220 KB / 160 KB. Raise them only together with a new measurement in this file.

## Hosting recommendations

Hosting is still `TODO` (AGENTS.md §2). Whichever provider is chosen:

| Path                                        | `Cache-Control`                                                   |
| ------------------------------------------- | ----------------------------------------------------------------- |
| `/_astro/*` (hashed JS, CSS, images, fonts) | `public, max-age=31536000, immutable`                             |
| `/media/*` (hero videos, not hashed)        | `public, max-age=604800` (rename files when the footage changes)  |
| `/brand/*`, `/favicon.ico`                  | `public, max-age=86400`                                           |
| HTML                                        | `public, max-age=0, must-revalidate` (or `s-maxage=300` on a CDN) |

- **Compression.** Serve brotli (fallback gzip) for HTML, CSS, JS, SVG, XML and JSON. Do not recompress AVIF, WebP, WOFF2 or MP4/WebM.
- **HTTP/2 or HTTP/3** with TLS 1.3, so the preloaded fonts, CSS and LCP image share one connection.
- **Video.** Make sure the host supports `Range` requests (`206`) for `/media/hero/*`.
- **Image CDN.** Mobilia photos are downloaded and optimized at build time into `/_astro`, so no runtime image CDN is needed. If the catalog grows enough to slow builds, consider a provider image service in `astro.config` (adapter-agnostic rule, §2). Keep the content data store and `node_modules/.astro` cached between CI builds so images are not re-encoded on every hourly rebuild. AVIF encoding is the slowest build step.
- **Replace the placeholder hero video** with licensed footage (§11). Encode it as VP9/AV1 WebM plus H.264 MP4, with a phone cut of 720 px or less at about 1 Mbps. `ffmpeg` was not available here, so the current files were not re-encoded.

## How to re-measure

```bash
pnpm build
pnpm preview --port 4410 --ignore-lock
# in another shell, 3 runs per page, take the median:
npx -y lighthouse@13.5.0 http://localhost:4410/es \
  --only-categories=performance --form-factor=mobile \
  --chrome-flags="--headless=new" --output=json --output-path=./lh-home-1.json
```

Repeat for one sale detail and the rent detail (URLs under `dist/es/venta/` and
`dist/es/alquiler/`). Lighthouse is run ad hoc and is not a project dependency. For CI, consider
`@lhci/cli` with assertions (`categories:performance ≥ 0.9`, `largest-contentful-paint ≤ 2500`)
once hosting and CI are decided.
