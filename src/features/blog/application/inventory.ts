import { buildPath } from "@/shared/i18n/routes";
import type { ArticleData } from "../infrastructure/articleFiles";

const iso = (date: Date | undefined): string =>
  date === undefined ? "-" : date.toISOString().slice(0, 10);
const cell = (text: string): string => text.replace(/\|/g, "\\|");

/**
 * `docs/blog/inventario-articulos.md`: the article inventory the editors use against
 * cannibalization. Generated from the content collection (never edited by hand), so the
 * collection stays the single source of truth.
 */
export function buildInventory(
  articles: readonly { readonly slug: string; readonly data: ArticleData }[],
): string {
  const rows = [...articles]
    .sort((a, b) => a.data.articleId.localeCompare(b.data.articleId))
    .map(({ slug, data }) =>
      [
        data.articleId,
        cell(data.title),
        cell(data.keyword),
        data.cluster,
        data.status,
        buildPath("blogPost", data.language, { slug }),
        iso(data.reviewedAt),
      ].join(" | "),
    );
  return [
    "# Inventario de artículos",
    "",
    "> Archivo generado con `bun run blog:inventory` desde `src/content/blog`. No se edita a mano:",
    "> la colección es la única fuente. Sirve para comprobar canibalización antes de proponer un tema.",
    "",
    "| ID | Título | Palabra clave principal | Grupo | Estado | URL | Revisado |",
    "|---|---|---|---|---|---|---|",
    ...(rows.length === 0 ? ["(sin artículos)"] : rows.map((row) => `| ${row} |`)),
    "",
  ].join("\n");
}
