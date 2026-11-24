import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "astro/zod";
import { parseMiniYaml } from "./miniYaml";
import { blogSchema } from "./blogSchema";

/**
 * Node-side reader of `src/content/blog/*.md`, used by the editorial checks (tests and
 * `bun run blog:check`), the inventory and the sitemap filter. It applies the same schema as the
 * Astro collection (the image is only a path here), so a file valid here is valid at build time.
 */
const schema = blogSchema(() => z.string());

export type ArticleData = z.infer<typeof schema>;

export interface LoadedArticle {
  /** File name without extension: the URL slug. */
  readonly slug: string;
  readonly file: string;
  readonly data: ArticleData;
  readonly body: string;
}

export interface ArticleIssue {
  /** Stable machine key of an editorial gate, when the schema gave one. */
  readonly key?: string | undefined;
  readonly path: string;
  readonly message: string;
}

export interface ArticleLoadError {
  readonly slug: string;
  readonly file: string;
  readonly issues: readonly ArticleIssue[];
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function splitFrontmatter(raw: string): { data: unknown; body: string } {
  const match = FRONTMATTER.exec(raw);
  if (match?.[1] === undefined) return { data: undefined, body: raw };
  return { data: parseMiniYaml(match[1]), body: match[2] ?? "" };
}

function issueKey(issue: z.core.$ZodIssue): string | undefined {
  const params: unknown = "params" in issue ? issue.params : undefined;
  if (typeof params === "object" && params !== null && "key" in params) {
    return typeof params.key === "string" ? params.key : undefined;
  }
  return undefined;
}

export function loadArticles(dir: string): {
  articles: LoadedArticle[];
  errors: ArticleLoadError[];
} {
  const articles: LoadedArticle[] = [];
  const errors: ArticleLoadError[] = [];
  const names = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();
  for (const name of names) {
    const file = path.join(dir, name);
    const slug = name.slice(0, -".md".length);
    let parsed: { data: unknown; body: string };
    try {
      parsed = splitFrontmatter(readFileSync(file, "utf8"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "cabecera ilegible";
      errors.push({ slug, file, issues: [{ path: "(cabecera)", message }] });
      continue;
    }
    const { data, body } = parsed;
    const result = schema.safeParse(data);
    if (result.success) {
      articles.push({ slug, file, data: result.data, body });
    } else {
      errors.push({
        slug,
        file,
        issues: result.error.issues.map((issue) => ({
          key: issueKey(issue),
          path: issue.path.join(".") || "(cabecera)",
          message: issue.message,
        })),
      });
    }
  }
  return { articles, errors };
}
