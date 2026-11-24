/**
 * Reads the SEO head of a built page and checks a whole site for the rules that must never
 * regress: one canonical, reciprocal hreflang across locales, one H1, parseable JSON-LD.
 * Pure string functions with no imports, so Vitest and `scripts/check-seo.ts` (Node) share them.
 */

export interface HeadAlternate {
  readonly hreflang: string;
  readonly href: string;
}

export interface PageHead {
  /** Path inside `dist`, only used to report problems. */
  readonly file: string;
  readonly lang: string | undefined;
  readonly title: string | undefined;
  readonly description: string | undefined;
  readonly canonical: string | undefined;
  readonly robots: string | undefined;
  readonly alternates: readonly HeadAlternate[];
  readonly ogImage: string | undefined;
  readonly h1Count: number;
  /** Parsed JSON-LD blocks; `undefined` entries are blocks that failed to parse. */
  readonly jsonLd: readonly unknown[];
  /** True for the meta-refresh pages Astro emits for redirects. */
  readonly isRedirect: boolean;
}

const ENTITIES: Readonly<Record<string, string>> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
};

function decode(value: string): string {
  return value.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, (entity) => ENTITIES[entity] ?? entity);
}

function attributesOf(tag: string): Map<string, string> {
  const attributes = new Map<string, string>();
  for (const match of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    const [, name, value] = match;
    if (name !== undefined && value !== undefined) attributes.set(name, decode(value));
  }
  return attributes;
}

function parseJson(source: string): unknown {
  try {
    return JSON.parse(source);
  } catch {
    return undefined;
  }
}

export function parseHead(file: string, html: string): PageHead {
  const metas = [...html.matchAll(/<meta\b[^>]*>/g)].map((match) => attributesOf(match[0]));
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map((match) => attributesOf(match[0]));
  const metaByName = (key: "name" | "property", name: string): string | undefined =>
    metas.find((meta) => meta.get(key) === name)?.get("content");
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  return {
    file,
    lang: html.match(/<html[^>]*\blang="([^"]*)"/)?.[1],
    title: title === undefined ? undefined : decode(title),
    description: metaByName("name", "description"),
    canonical: links.find((link) => link.get("rel") === "canonical")?.get("href"),
    robots: metaByName("name", "robots"),
    alternates: links
      .filter((link) => link.get("rel") === "alternate" && link.has("hreflang"))
      .map((link) => ({ hreflang: link.get("hreflang") ?? "", href: link.get("href") ?? "" })),
    ogImage: metaByName("property", "og:image"),
    h1Count: [...html.matchAll(/<h1[\s>]/g)].length,
    jsonLd: [
      ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
    ].map((match) => parseJson(match[1] ?? "")),
    isRedirect: /<meta[^>]*http-equiv="refresh"/.test(html),
  };
}

export interface SeoAuditOptions {
  /** `hreflang` values every multilingual page must list (plus `x-default`). */
  readonly hreflangs: readonly string[];
}

const isIndexable = (page: PageHead): boolean =>
  !page.isRedirect && !(page.robots ?? "").includes("noindex");

/** Problems of one indexable page that do not depend on other pages. */
function pageProblems(page: PageHead, options: SeoAuditOptions): string[] {
  const problems: string[] = [];
  const add = (message: string): number => problems.push(`${page.file}: ${message}`);
  if (page.title === undefined || page.title.trim() === "") add("missing <title>");
  if (page.description === undefined || page.description.trim() === "") {
    add("missing meta description");
  }
  if (page.lang === undefined) add("missing <html lang>");
  if (page.h1Count !== 1) add(`expected one <h1>, found ${page.h1Count}`);
  if (page.ogImage === undefined || !/^https?:\/\//.test(page.ogImage)) {
    add("og:image missing or not absolute");
  }
  if (page.jsonLd.some((block) => block === undefined)) add("JSON-LD block does not parse");
  if (page.canonical === undefined) {
    add("missing canonical");
    return problems;
  }
  if (!/^https?:\/\//.test(page.canonical)) add(`canonical is not absolute: ${page.canonical}`);
  const self = page.alternates.filter((alternate) => alternate.href === page.canonical);
  if (self.length === 0) add("canonical is not one of its own hreflang alternates");
  const declared = new Set(page.alternates.map((alternate) => alternate.hreflang));
  for (const hreflang of [...options.hreflangs, "x-default"]) {
    if (!declared.has(hreflang)) add(`missing hreflang ${hreflang}`);
  }
  return problems;
}

/**
 * Checks every page of a build. Pages in several locales must list all of them plus
 * `x-default`, and every alternate must exist, be indexable and list this page back
 * with the same hreflang (reciprocity). Redirect and `noindex` pages are not checked.
 */
export function auditSite(pages: readonly PageHead[], options: SeoAuditOptions): string[] {
  const indexable = pages.filter(isIndexable);
  const byCanonical = new Map<string, PageHead>();
  const problems: string[] = [];
  for (const page of indexable) {
    problems.push(...pageProblems(page, options));
    if (page.canonical === undefined) continue;
    const other = byCanonical.get(page.canonical);
    if (other !== undefined) problems.push(`${page.file}: canonical also used by ${other.file}`);
    byCanonical.set(page.canonical, page);
  }
  for (const page of indexable) {
    for (const alternate of page.alternates) {
      const target = byCanonical.get(alternate.href);
      if (target === undefined) {
        problems.push(
          `${page.file}: hreflang ${alternate.hreflang} → ${alternate.href} is not an indexable page`,
        );
        continue;
      }
      if (page.canonical === undefined) continue;
      const backlink = target.alternates.find((candidate) => candidate.href === page.canonical);
      if (backlink === undefined) {
        problems.push(`${page.file}: ${alternate.href} does not list it back`);
      } else if (alternate.hreflang !== "x-default" && backlink.hreflang !== page.lang) {
        problems.push(
          `${page.file}: hreflang ${backlink.hreflang} in ${target.file} differs from its lang`,
        );
      }
    }
  }
  return problems;
}

/** Meta-refresh pages must be `noindex` and canonical to their destination (never to themselves). */
export function auditRedirects(pages: readonly PageHead[]): string[] {
  return pages
    .filter((page) => page.isRedirect)
    .flatMap((page) => {
      const problems: string[] = [];
      if (!(page.robots ?? "").includes("noindex"))
        problems.push(`${page.file}: redirect page is not noindex`);
      if (page.canonical === undefined)
        problems.push(`${page.file}: redirect page has no canonical`);
      return problems;
    });
}
