// @ts-check
import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "dist/",
    ".astro/",
    "node_modules/",
    "playwright-report/",
    "test-results/",
    "coverage/",
  ]),
  js.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  astro.configs.recommended,
  {
    rules: {
      // AGENTS.md §8.1: no non-null assertions, no `any`, no ts-ignore.
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      // TypeScript already reports undefined identifiers (and knows Node/browser globals).
      "no-undef": "off",
    },
  },
);
