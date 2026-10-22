// Lets plain `tsc --noEmit` resolve `.astro` imports in Vitest component tests.
// `astro check` uses the Astro language server and gets the real component types.
declare module "*.astro" {
  import type { AstroComponentFactory } from "astro/runtime/server/index.js";

  const component: AstroComponentFactory;
  export default component;
}
