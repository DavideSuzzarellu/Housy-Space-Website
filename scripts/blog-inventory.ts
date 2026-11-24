/**
 * `bun run blog:inventory`: writes `docs/blog/inventario-articulos.md` from `src/content/blog`,
 * so the content collection stays the single source of the article inventory.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { buildInventory } from "../src/features/blog/application/inventory";
import { checkCollection } from "../src/features/blog/infrastructure/blogCollection";

const { articles, loadErrors } = checkCollection();
if (loadErrors.length > 0) {
  console.error(
    `Hay artículos con la cabecera inválida (${loadErrors.map((error) => error.slug).join(", ")}). Ejecuta bun run blog:check.`,
  );
  process.exit(1);
}
mkdirSync("docs/blog", { recursive: true });
writeFileSync("docs/blog/inventario-articulos.md", buildInventory(articles));
console.log(`docs/blog/inventario-articulos.md: ${articles.length} artículo(s).`);
