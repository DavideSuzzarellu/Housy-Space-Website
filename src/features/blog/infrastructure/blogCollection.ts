import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { allowedMarketFigures } from "@/features/districts/application/marketFigures";
import { marketSchema } from "@/features/districts/infrastructure/marketSchema";
import { checkAll, type Finding } from "../application/checkArticle";
import { buildLinkAllowList } from "../application/linkAllowList";
import { loadArticles, type ArticleLoadError, type LoadedArticle } from "./articleFiles";

export interface CollectionReport {
  readonly articles: readonly LoadedArticle[];
  /** Files whose frontmatter fails the schema (including the editorial gates). */
  readonly loadErrors: readonly ArticleLoadError[];
  readonly findings: readonly Finding[];
}

export const BLOG_DIR = "src/content/blog";
const MARKET_FILE = "src/content/market/barcelona.json";

/** Loads `src/content/blog` and runs every check on it. Used by Vitest and `bun run blog:check`. */
export function checkCollection(root: string = process.cwd()): CollectionReport {
  const { articles, errors } = loadArticles(path.join(root, BLOG_DIR));
  const market = marketSchema.parse(JSON.parse(readFileSync(path.join(root, MARKET_FILE), "utf8")));
  const findings = checkAll(articles, {
    links: buildLinkAllowList({ market, articleSlugs: articles.map((article) => article.slug) }),
    figures: allowedMarketFigures(market),
    // The image path is relative to the article file (`../../assets/...`).
    imageExists: (image) => existsSync(path.resolve(root, BLOG_DIR, image)),
  });
  return { articles, loadErrors: errors, findings };
}
