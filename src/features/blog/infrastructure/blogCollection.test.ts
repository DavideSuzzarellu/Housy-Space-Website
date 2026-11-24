import { describe, expect, it } from "vitest";
import { checkCollection } from "./blogCollection";

/**
 * Every article in `src/content/blog` must pass the editorial and SEO checks (also available as
 * `bun run blog:check`). An empty collection passes: there is nothing to check yet.
 */
describe("blog collection", () => {
  const report = checkCollection();

  it("has valid frontmatter in every article", () => {
    expect(report.loadErrors.map((error) => `${error.slug}: ${error.issues[0]?.message}`)).toEqual(
      [],
    );
  });

  it("has no editorial or SEO check errors", () => {
    const errors = report.findings.filter((finding) => finding.severity === "error");
    expect(errors.map((finding) => `${finding.slug} [${finding.rule}] ${finding.message}`)).toEqual(
      [],
    );
  });
});
