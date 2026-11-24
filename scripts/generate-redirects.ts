/**
 * Writes `docs/redirects.generated.txt`: every permanent redirect of the site as host rules
 * (`from to 301`, Cloudflare Pages / Netlify `_redirects` syntax), from the single source
 * `src/shared/i18n/retiredRoutes.ts`. Run `bun run redirects` (Bun resolves the extensionless source imports) after changing that file; a test
 * fails when the committed file is stale. Pass `--base=/repo` for a site served under a sub-path.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getRetiredRedirectRules, renderRedirectRules } from "../src/shared/i18n/retiredRoutes";

const base = process.argv.find((arg) => arg.startsWith("--base="))?.slice("--base=".length) ?? "";
const output = fileURLToPath(new URL("../docs/redirects.generated.txt", import.meta.url));
writeFileSync(output, renderRedirectRules(getRetiredRedirectRules(), base));
console.log(`Wrote ${output}`);
