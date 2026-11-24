import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allowedMarketFigures } from "@/features/districts/application/marketFigures";
import { marketSchema } from "@/features/districts/infrastructure/marketSchema";
import type { ArticleData } from "../infrastructure/articleFiles";
import {
  checkArticle,
  type CheckableArticle,
  type CheckContext,
  type Finding,
} from "./checkArticle";
import { buildLinkAllowList } from "./linkAllowList";

const market = marketSchema.parse(
  JSON.parse(readFileSync("src/content/market/barcelona.json", "utf8")),
);

const DATA: ArticleData = {
  title: "Cuánto vale mi piso en Barcelona",
  description: "d".repeat(148),
  date: new Date("2026-12-01"),
  category: "valoracion",
  language: "es",
  image: "../../assets/home/sky-1400.jpg",
  imageAlt: "Vista de la ciudad",
  articleId: "HS-2026-12-01",
  status: "publicado",
  keyword: "cuánto vale mi piso en Barcelona",
  intent: "informacional",
  cluster: "A",
  cta: "valoracion",
  legalFiscal: false,
  legalReview: "no_aplica",
  sources: [],
  reviewedAt: new Date("2026-11-28"),
};

const FILLER = "palabra de relleno para alargar el texto ".repeat(60);
const BODY = `Saber cuánto vale mi piso en Barcelona exige comparar viviendas parecidas. Una [valoración profesional](/es/servicios/valoracion) te da una cifra defendible.

## Qué factores pesan en el precio

La ubicación manda, como se ve en [los barrios](/es/vivir-en-barcelona). ${FILLER}

### Detalle

Más texto.

## Cuándo pedir una valoración

Antes de [vender](/es/vender).
`;

function article(
  slug: string,
  overrides: Partial<ArticleData> = {},
  body = BODY,
): CheckableArticle {
  return { slug, data: { ...DATA, ...overrides }, body };
}

const links = buildLinkAllowList({ market, articleSlugs: ["cuanto-vale-mi-piso", "otro"] });

function run(
  subject: CheckableArticle,
  others: CheckableArticle[] = [],
  extra: Partial<CheckContext> = {},
): Finding[] {
  return checkArticle(subject, {
    articles: [subject, ...others],
    links,
    figures: allowedMarketFigures(market),
    imageExists: () => true,
    ...extra,
  });
}

const rules = (findings: Finding[]) => findings.map((finding) => finding.rule);
const main = article("cuanto-vale-mi-piso");

describe("checkArticle", () => {
  it("passes a well-formed article with no findings", () => {
    expect(run(main)).toEqual([]);
  });

  describe("identity and cannibalization", () => {
    it("flags a repeated article id, primary keyword or title", () => {
      const twin = article("gemelo", {
        articleId: "HS-2026-12-01",
        keyword: "Cuanto vale mi piso en barcelona",
        title: "cuánto vale mi piso en barcelona",
      });
      expect(rules(run(main, [twin]))).toEqual(
        expect.arrayContaining(["duplicate-article-id", "duplicate-keyword", "duplicate-title"]),
      );
    });

    it("passes when id, keyword and title are all different", () => {
      const other = article("otro", {
        articleId: "HS-2026-12-02",
        keyword: "gastos de vender un piso",
        title: "Gastos de vender un piso",
      });
      expect(rules(run(main, [other]))).not.toContain("duplicate-keyword");
    });
  });

  describe("keyword and titles", () => {
    it("requires the keyword in the title or the SEO title", () => {
      const noKeyword = article("a", { title: "Valorar una vivienda" });
      expect(rules(run(noKeyword))).toContain("keyword-missing-in-title");
      const viaSeoTitle = article("a", {
        title: "Valorar una vivienda",
        seoTitle: "Cuánto vale mi piso en Barcelona hoy",
      });
      expect(rules(run(viaSeoTitle))).not.toContain("keyword-missing-in-title");
    });

    it("requires the keyword within the first 100 words", () => {
      const late = article("a", {}, `${"palabra ".repeat(120)}cuánto vale mi piso en Barcelona`);
      expect(rules(run(late))).toContain("keyword-missing-in-intro");
    });

    it("caps the effective title at 60 characters", () => {
      const long = article("a", {
        keyword: "cuánto vale",
        title: `Cuánto vale ${"x".repeat(60)}`,
      });
      expect(rules(run(long))).toContain("title-too-long");
      const withSeo = article("a", { ...long.data, seoTitle: "Cuánto vale mi piso" });
      expect(rules(run(withSeo))).not.toContain("title-too-long");
    });

    it("rates a bad description an error, or only a warning on a draft", () => {
      const bad = article("a", { description: "corta" });
      expect(run(bad).find((f) => f.rule === "description-length")?.severity).toBe("error");
      const draft = article("a", { description: "corta", status: "borrador" });
      expect(run(draft).find((f) => f.rule === "description-length")?.severity).toBe("warning");
    });
  });

  describe("links", () => {
    it("needs two internal links, one of them to a service", () => {
      const none = article("a", {}, "cuánto vale mi piso en Barcelona sin enlaces.");
      expect(rules(run(none))).toEqual(
        expect.arrayContaining(["internal-links-min", "service-link-missing"]),
      );
      const noService = article(
        "a",
        {},
        "cuánto vale mi piso en Barcelona: [a](/es/vender) y [b](/es/contacto).",
      );
      const found = rules(run(noService));
      expect(found).not.toContain("internal-links-min");
      expect(found).toContain("service-link-missing");
    });

    it("rejects internal links that are not real routes and relative links", () => {
      const broken = article(
        "a",
        {},
        `${BODY}\n[x](/es/servicios/inventado) [y](/es/blog/no-existe) [z](contacto)`,
      );
      const findings = run(broken).filter((f) => f.rule === "link-not-found");
      expect(findings.map((f) => f.message).join(" ")).toContain("/es/servicios/inventado");
      expect(findings.map((f) => f.message).join(" ")).toContain("/es/blog/no-existe");
      expect(rules(run(broken))).toContain("link-relative");
    });

    it("accepts links to existing articles and warns about another locale or an unpublished target", () => {
      const withArticle = article("a", {}, `${BODY}\n[más](/es/blog/otro) [en](/en/sell)`);
      const draftTarget = article("otro", {
        status: "borrador",
        articleId: "HS-2026-12-09",
        keyword: "otro tema",
      });
      const found = run(withArticle, [draftTarget]);
      expect(rules(found)).not.toContain("link-not-found");
      expect(rules(found)).toContain("link-other-language");
      expect(rules(found)).toContain("link-unpublished-article");
    });
  });

  describe("structure", () => {
    it("forbids an h1 in the body and skipped heading levels", () => {
      expect(rules(run(article("a", {}, `# Otro titulo\n\n${BODY}`)))).toContain("body-h1");
      const skipped = article("a", {}, BODY.replace("### Detalle", "#### Detalle"));
      expect(rules(run(skipped))).toContain("heading-order");
      const startsDeep = article("a", {}, `### Primero\n\n${BODY}`);
      expect(rules(run(startsDeep))).toContain("heading-order");
    });

    it("requires alt text for body images and an existing main image", () => {
      expect(rules(run(article("a", {}, `${BODY}\n![](/x.png)`)))).toContain("body-image-alt");
      expect(rules(run(article("a", {}, `${BODY}\n![ok](/x.png)`)))).not.toContain(
        "body-image-alt",
      );
      expect(rules(run(main, [], { imageExists: () => false }))).toContain("image-missing");
    });
  });

  describe("legal and market claims", () => {
    it("requires sources for a legal/tax article", () => {
      const legal = article("a", { legalFiscal: true, legalReview: "aprobada" });
      expect(rules(run(legal))).toContain("sources-required");
      const sourced = article("a", {
        legalFiscal: true,
        legalReview: "aprobada",
        sources: [{ label: "BOE", url: "https://www.boe.es/", checkedAt: new Date("2026-11-20") }],
      });
      expect(rules(run(sourced))).not.toContain("sources-required");
    });

    it("accepts €/m² and €/mes figures of the market data and rejects invented ones", () => {
      const ok = `${BODY}\nEl precio de la ciudad es de ${market.city.sale} €/m² y el alquiler de ${market.city.rent} €/mes.`;
      expect(rules(run(article("a", {}, ok)))).not.toContain("market-figure-unknown");
      const invented = article(
        "a",
        {},
        `${BODY}\nSe vende a 9.999 €/m² y se alquila por 77 €/mes.`,
      );
      const findings = run(invented).filter((f) => f.rule === "market-figure-unknown");
      expect(findings).toHaveLength(2);
      expect(findings[0]?.severity).toBe("error");
    });

    it("rejects banned promises", () => {
      const promise = article(
        "a",
        {},
        `${BODY}\nOfrecemos el mejor precio y una venta sin riesgo.`,
      );
      const found = run(promise).filter((f) => f.rule === "banned-claim");
      expect(found.map((f) => f.message).join(" ")).toContain("el mejor precio");
      expect(found.every((f) => f.severity === "error")).toBe(true);
    });
  });

  describe("quality warnings", () => {
    it("warns about near-duplicate content between articles, not about different ones", () => {
      const copy = article("copia", {
        articleId: "HS-2026-12-05",
        keyword: "otra clave",
        title: "Otra",
      });
      expect(run(main, [copy]).find((f) => f.rule === "duplicate-content")?.severity).toBe(
        "warning",
      );
      const different = article(
        "distinto",
        { articleId: "HS-2026-12-06", keyword: "gastos", title: "Gastos" },
        `${"gastos de notaria registro e impuestos al vender ".repeat(40)}`,
      );
      expect(rules(run(main, [different]))).not.toContain("duplicate-content");
    });

    it("warns about a very short published article, but never a short draft", () => {
      const short =
        "cuánto vale mi piso en Barcelona. [a](/es/vender) [b](/es/servicios/valoracion)";
      expect(run(article("a", {}, short)).find((f) => f.rule === "short-article")?.severity).toBe(
        "warning",
      );
      expect(rules(run(article("a", { status: "borrador" }, short)))).not.toContain(
        "short-article",
      );
    });
  });

  it("labels each finding with the article it belongs to", () => {
    const [finding] = run(article("a", { title: "Valorar" }));
    expect(finding).toMatchObject({ slug: "a", articleId: "HS-2026-12-01" });
  });
});
