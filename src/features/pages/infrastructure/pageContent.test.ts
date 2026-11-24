import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "astro/zod";
import { describe, expect, it } from "vitest";
import { marketSchema } from "@/features/districts/infrastructure/marketSchema";
import shapes from "@/features/districts/infrastructure/shapes.json";
import { resolveContentHref } from "@/shared/i18n/contentLinks";
import { pageSchema } from "./pageSchema";

const PAGES_DIR = "src/content/pages";
const schema = pageSchema(() => z.string().regex(/^\.\.\/\.\.\/assets\/[\w./-]+$/));
const files = readdirSync(PAGES_DIR).filter((file) => file.endsWith(".json"));
const read = (file: string): unknown =>
  JSON.parse(readFileSync(path.join(PAGES_DIR, file), "utf8"));

/** Every string in a JSON value, however deep. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap(strings);
  return [];
}

describe("editorial pages", () => {
  it("has the Spanish source of the 20 editorial pages", () => {
    expect(files.filter((file) => file.endsWith(".es.json"))).toHaveLength(20);
  });

  it.each(files)("%s validates against the schema", (file) => {
    const result = schema.safeParse(read(file));
    expect(result.success, JSON.stringify(result.error?.issues.slice(0, 3))).toBe(true);
  });

  it.each(files)("%s only links to pages that exist", (file) => {
    const targets = strings(read(file)).flatMap((text) =>
      [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((match) => match[1] ?? ""),
    );
    for (const target of targets) {
      expect(() => resolveContentHref(target, "es"), target).not.toThrow();
    }
  });

  it.each(files)("%s has no prototype leftovers", (file) => {
    const all = strings(read(file));
    expect(all).not.toContain("Imagen conceptual (IA)");
    expect(all).not.toContain("web");
  });
});

describe("service pages", () => {
  const services = files.filter((file) => file.startsWith("service-"));

  it("has the 8 services in the 4 locales", () => {
    expect(services).toHaveLength(32);
  });

  it.each(services)("%s opens with its illustration and an emphasised heading", (file) => {
    const page = schema.parse(read(file));
    expect(page.head.photo).toBe(false);
    expect(page.head.illustration?.alt.length).toBeGreaterThan(0);
    expect(page.head.illustration?.scale).toBeGreaterThan(0.5);
    expect(page.head.illustration?.scale).toBeLessThanOrEqual(1);
    expect(page.head.heading).toMatch(/\*[^*]+\*/);
  });

  /** Explicit layout of each section, in order; `-` follows from the items (steps, faq, band, text). */
  const LAYOUTS: Record<string, string> = {
    "alquiler-gestion": "intro split - - cta",
    "asesoramiento-financiero": "intro split - - colab cta",
    "asesoramiento-juridico-fiscal": "intro split tax - colab cta",
    "inversion-inmobiliaria": "intro cards - route cta",
    "personal-shopper": "intro - cards call - cta",
    "reformas-obras": "intro stepsList swatches cards cards - colab cta",
    valoracion: "cmp doc - cta",
    "venta-estrategica": "introLined - check split - valuation cta",
  };

  it.each(services)("%s declares the layout of every section", (file) => {
    const key = /^service-(.+)\.\w\w\.json$/.exec(file)?.[1] ?? "";
    const page = schema.parse(read(file));
    expect(page.sections.map((section) => section.layout ?? "-").join(" ")).toBe(LAYOUTS[key]);
  });

  it.each(services)("%s links its list entries and tax or comparison columns as cards", (file) => {
    const page = schema.parse(read(file));
    for (const section of page.sections) {
      if (section.layout === "sit" || section.layout === "route") {
        const lists = section.items.filter((item) => item.kind === "list");
        for (const list of lists) {
          expect(list.items.every((entry) => entry.href !== undefined)).toBe(true);
        }
      }
      if (section.layout === "tax" || section.layout === "cmp") {
        expect(section.items.some((item) => item.kind === "card")).toBe(true);
        expect(section.items.some((item) => item.kind === "h3")).toBe(false);
      }
      if (section.layout === "trio") {
        const lists = section.items.filter((item) => item.kind === "list");
        for (const list of lists) {
          expect(list.items.every((entry) => entry.kicker !== undefined)).toBe(true);
        }
      }
    }
  });

  it("rejects an illustration without a text alternative", () => {
    const base = schema.parse(read("service-valoracion.es.json"));
    const broken = {
      ...base,
      head: {
        ...base.head,
        illustration: {
          src: "../../assets/servicios/ill-valoracion-1000.webp",
          alt: "",
          scale: 0.7,
        },
      },
    };
    expect(schema.safeParse(broken).success).toBe(false);
  });
});

describe("market data", () => {
  const market = marketSchema.parse(
    JSON.parse(readFileSync("src/content/market/barcelona.json", "utf8")),
  );

  it("covers every district and barrio of Barcelona", () => {
    expect(market.districts).toHaveLength(10);
    expect(market.barrios).toHaveLength(73);
    for (const district of market.districts) {
      const barrios = market.barrios.filter((barrio) => barrio.district === district.slug);
      expect(barrios, district.name).toHaveLength(district.barrioCount);
    }
  });

  it("has a shape for each of them", () => {
    expect(Object.keys(shapes.barrios).sort()).toEqual(market.barrios.map((b) => b.slug).sort());
    expect(Object.keys(shapes.districts).sort()).toEqual(
      market.districts.map((d) => d.slug).sort(),
    );
  });
});

describe("my search form", () => {
  /** Every `chips` leaf of a page, however deep. */
  function chips(value: unknown): object[] {
    if (Array.isArray(value)) return value.flatMap(chips);
    if (typeof value !== "object" || value === null) return [];
    const own = "kind" in value && value.kind === "chips" ? [value] : [];
    return [...own, ...Object.values(value).flatMap(chips)];
  }

  it.each(["es", "en", "it", "ca"])("%s: only the operation and the type are option cards", (l) => {
    const cards = chips(read(`homeSearch.${l}.json`)).filter((c) => "cards" in c);
    expect(cards.map((c) => ("name" in c ? c.name : ""))).toEqual(["operacion", "tipo"]);
  });
});

describe("legal pages", () => {
  const legal = ["legal", "privacy", "cookies"];
  const kinds = (file: string): string[] =>
    schema.parse(read(file)).sections.flatMap((section) => section.items.map((item) => item.kind));

  it.each(legal)("%s: the approved Spanish text has no pending notice or draft marker", (key) => {
    expect(kinds(`${key}.es.json`)).not.toContain("pending");
    expect(strings(read(`${key}.es.json`)).join(" ")).not.toMatch(/\b(pendiente|borrador)\b/i);
  });

  it.each(legal.flatMap((key) => ["en", "it", "ca"].map((locale) => `${key}.${locale}.json`)))(
    "%s keeps the pending lawyer review notice (AGENTS.md section 4)",
    (file) => {
      expect(kinds(file)).toContain("pending");
    },
  );

  it.each(["en", "it", "ca", "es"])(
    "privacy.%s has the 10 sections of the approved text",
    (locale) => {
      expect(kinds(`privacy.${locale}.json`).filter((kind) => kind === "h2")).toHaveLength(10);
    },
  );
});
