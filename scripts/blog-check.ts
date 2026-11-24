/**
 * `bun run blog:check`: editorial and SEO checks of every article in `src/content/blog`.
 * Prints a table of findings and exits 1 when there is any error (warnings never fail).
 * Runs on Bun (not Node): it reuses the site's TypeScript modules and their `@/` aliases.
 */
import { checkCollection } from "../src/features/blog/infrastructure/blogCollection";

const report = checkCollection();

interface Row {
  readonly severity: "ERROR" | "WARN";
  readonly article: string;
  readonly rule: string;
  readonly message: string;
}

const rows: Row[] = [
  ...report.loadErrors.flatMap((error) =>
    error.issues.map((issue): Row => ({
      severity: "ERROR",
      article: error.slug,
      rule: issue.key ?? `frontmatter:${issue.path}`,
      message: issue.message,
    })),
  ),
  ...report.findings.map((finding): Row => ({
    severity: finding.severity === "error" ? "ERROR" : "WARN",
    article: finding.slug,
    rule: finding.rule,
    message: finding.message,
  })),
];

const total = report.articles.length + report.loadErrors.length;
if (rows.length > 0) {
  const pad = (text: string, width: number): string => text.padEnd(width);
  const widths = {
    article: Math.max(7, ...rows.map((row) => row.article.length)),
    rule: Math.max(4, ...rows.map((row) => row.rule.length)),
  };
  console.log(
    `${pad("NIVEL", 6)} ${pad("ARTICULO", widths.article)} ${pad("REGLA", widths.rule)} MENSAJE`,
  );
  for (const row of rows) {
    console.log(
      `${pad(row.severity, 6)} ${pad(row.article, widths.article)} ${pad(row.rule, widths.rule)} ${row.message}`,
    );
  }
  console.log("");
}

const errors = rows.filter((row) => row.severity === "ERROR").length;
const warnings = rows.length - errors;
console.log(`${total} artículo(s) revisados: ${errors} error(es), ${warnings} aviso(s).`);
process.exit(errors > 0 ? 1 : 0);
