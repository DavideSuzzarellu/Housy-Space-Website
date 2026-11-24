import { describe, expect, it } from "vitest";
import market from "../../content/market/barcelona.json";
import { PRODUCTION_ORIGIN } from "../lib/seo/indexability";
import { LOCALES } from "./config";
import { getHostRedirectRules, renderHostRedirects } from "./hostRedirects";
import reference from "./referenceSitePaths.fixture.json";
import { getLocalizedPath, ROUTE_KEYS, routes } from "./routes";
import { getServiceSlug, SERVICE_KEYS } from "./services";

const rules = getHostRedirectRules();
const exact = rules.filter((rule) => !rule.from.endsWith("/*"));
const splats = rules.filter((rule) => rule.from.endsWith("/*"));

/** The rule that answers a path: an exact source, or a splat whose prefix contains it. */
const ruleFor = (pathname: string) =>
  exact.find((rule) => rule.from === pathname) ??
  splats.find((rule) => pathname.startsWith(rule.from.slice(0, -1)));

/** Every URL of the reference site, with and without trailing slash and as index.html. */
const referencePaths = [...new Set([...reference.sitemap, ...reference.folders])].flatMap((page) =>
  page === "/" ? ["/", "/index.html"] : [page.replace(/\/$/, ""), page, `${page}index.html`],
);

/** Static (non-localized) paths of the new site, for destination checks. */
const newSitePaths = new Set<string>([
  ...LOCALES.flatMap((locale) =>
    ROUTE_KEYS.filter((key) => !/\{/.test(routes[key][locale])).map((key) =>
      key === "home" ? getLocalizedPath("home", locale) : getLocalizedPath(key as "sale", locale),
    ),
  ),
  ...LOCALES.flatMap((locale) => [
    ...SERVICE_KEYS.map((service) =>
      getLocalizedPath("serviceDetail", locale, { service: getServiceSlug(service, locale) }),
    ),
    ...market.districts.map(({ slug }) => getLocalizedPath("district", locale, { district: slug })),
    ...market.barrios.map(({ slug }) => getLocalizedPath("barrio", locale, { barrio: slug })),
  ]),
]);

describe("reference site fixture", () => {
  it("has the 103 sitemap URLs and the pages the sitemap leaves out", () => {
    expect(reference.sitemap).toHaveLength(103);
    expect(reference.folders).toContain("/datos/");
    expect(reference.folders.length).toBeGreaterThan(103);
  });
});

describe("migration redirects (reference site -> new site)", () => {
  it("covers every URL of the reference site, in all three forms", () => {
    const missing = referencePaths.filter((pathname) => ruleFor(pathname) === undefined);
    expect(missing).toEqual([]);
  });

  it("covers the sources of the reference's own _redirects, retargeted to the new site", () => {
    for (const source of reference.ownRedirects) {
      const rule = ruleFor(source);
      expect(rule, source).toBeDefined();
      expect(rule?.to.startsWith("/es"), source).toBe(true);
    }
    expect(ruleFor("/vende")?.to).toBe("/es/servicios/venta-estrategica");
    expect(ruleFor("/servicios/asesoramiento")?.to).toBe("/es/servicios");
  });

  it("maps the reference pages to their Spanish routes", () => {
    expect(ruleFor("/")?.to).toBe("/es");
    expect(ruleFor("/propiedades/")?.to).toBe("/es/venta");
    expect(ruleFor("/propiedades/piso-senorial-dreta-eixample-demo-001/")?.to).toBe("/es/venta");
    expect(ruleFor("/servicios/valoracion")?.to).toBe("/es/servicios/valoracion");
    expect(ruleFor("/nosotros/index.html")?.to).toBe("/es/nosotros");
    expect(ruleFor("/blog/es-fiable-valoracion-online/")?.to).toBe("/es/blog");
    expect(ruleFor("/zonas/barcelona/")?.to).toBe("/es/zonas/barcelona");
    expect(ruleFor("/zonas/barcelona/distritos/gracia/")?.to).toBe(
      "/es/zonas/barcelona/distritos/gracia",
    );
    expect(ruleFor("/zonas/barcelona/el-raval")?.to).toBe("/es/zonas/barcelona/el-raval");
  });

  it("sends every destination to a real route of the new site (no trailing slash)", () => {
    const unknown = rules
      .map((rule) => rule.to)
      .filter((to) => to.endsWith("/") || !newSitePaths.has(to));
    expect([...new Set(unknown)]).toEqual([]);
  });

  it("has no loops or chains: no destination is the source of another rule", () => {
    const chained = rules.filter((rule) => ruleFor(rule.to) !== undefined);
    expect(chained).toEqual([]);
    expect(rules.filter((rule) => rule.from === rule.to)).toEqual([]);
  });

  it("has unique sources, all 301, and fits Cloudflare's limits (2000 static, 100 dynamic)", () => {
    const sources = rules.map((rule) => rule.from);
    expect(new Set(sources).size).toBe(sources.length);
    expect(rules.every((rule) => rule.status === 301)).toBe(true);
    expect(exact.length).toBeLessThanOrEqual(2000);
    expect(splats.length).toBeLessThanOrEqual(100);
  });
});

describe("production _redirects text", () => {
  const lines = renderHostRedirects(PRODUCTION_ORIGIN).trimEnd().split("\n");

  it("has absolute destinations on the canonical origin and no site base", () => {
    expect(lines[0]).toBe(`/ ${PRODUCTION_ORIGIN}/es 301`);
    expect(lines.every((line) => line.endsWith(" 301"))).toBe(true);
    expect(
      lines.every((line) => new RegExp(`^/\\S* ${PRODUCTION_ORIGIN}/\\S+ 301$|^/ `).test(line)),
    ).toBe(true);
    expect(lines.join("\n")).not.toContain("Housy-Space-Website");
  });

  it("collapses each old province family into one splat rule", () => {
    expect(lines).toContain(
      `/es/provincia-de-barcelona/* ${PRODUCTION_ORIGIN}/es/zonas/barcelona 301`,
    );
    expect(lines.filter((line) => line.includes("/*"))).toHaveLength(5);
  });
});
