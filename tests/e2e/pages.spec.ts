import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  ["/es/servicios/venta-estrategica", "Compraventa e intermediación inmobiliaria"],
  ["/es/servicios/asesoramiento-juridico-fiscal", "Asesoramiento jurídico y fiscal"],
  ["/es/nosotros", "Mucho más que una inmobiliaria"],
  ["/es/contacto", "Hablemos"],
  ["/es/mi-busqueda", "Tu próximo hogar empieza aquí"],
  ["/es/busqueda-a-medida", "Búsqueda a medida"],
  ["/es/valoracion", "La próxima propiedad podría ser la tuya"],
  ["/es/vender", "Vende tu inmueble con criterio."],
  ["/es/provincia-de-barcelona", "Provincia de Barcelona"],
  ["/es/provincia-de-barcelona/abrera", "Abrera"],
  ["/es/blog", "Blog y noticias"],
  ["/es/guia-internacional", "Comprar en Barcelona desde el extranjero"],
  ["/es/datos", "Estado de los datos"],
  ["/es/aviso-legal", "Aviso legal"],
  ["/es/privacidad", "Política de privacidad"],
  ["/es/cookies", "Política de cookies"],
  ["/es/vivir-en-barcelona", "Barcelona, barrio a barrio"],
  ["/es/vivir-en-barcelona/gracia", "Gràcia"],
  ["/es/vivir-en-barcelona/nou-barris/verdun", "Verdun"],
] as const;

for (const [url, heading] of PAGES) {
  test(`${url} renders with no accessibility violations`, async ({ page }) => {
    const response = await page.goto(url);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toContainText(heading);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .exclude("iframe")
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

const SERVICES = [
  "venta-estrategica",
  "valoracion",
  "asesoramiento",
  "asesoramiento-financiero",
  "asesoramiento-juridico-fiscal",
  "reformas-obras",
  "personal-shopper",
  "inversion-inmobiliaria",
  "alquiler-gestion",
] as const;

for (const service of SERVICES) {
  test(`/es/servicios/${service} has its illustrated head and its own closing block`, async ({
    page,
  }) => {
    await page.goto(`/es/servicios/${service}`);
    const head = page.locator("[data-page-head]");
    // The illustration is the only eager image of the page and carries a text alternative.
    await expect(head.locator("img[fetchpriority='high']")).toHaveCount(1);
    await expect(head.locator("img[alt]:not([alt=''])")).toHaveCount(1);
    // "Hablemos" scrolls to the closing block, which lists the other eight services.
    await head.getByRole("link", { name: "Hablemos" }).click();
    await expect(page.locator("#hablemos")).toBeInViewport();
    await expect(page.locator("#hablemos nav a")).toHaveCount(8);
    // The footer's own "¡Hablemos!" row is hidden: the page closes with its own.
    await expect(page.locator("[data-footer-cta]")).toBeHidden();
  });
}

test("the compraventa page lists eight steps and twelve inclusions", async ({ page }) => {
  await page.goto("/es/servicios/venta-estrategica");
  await expect(page.locator("main ol li").filter({ has: page.locator("h3") })).toHaveCount(8);
  await expect(
    page.getByRole("heading", { name: "Todo lo que hace falta para vender" }),
  ).toBeVisible();
  await expect(page.locator("section:has(h2:text('Todo lo que hace falta')) ul > li")).toHaveCount(
    12,
  );
});

test("frequently asked questions open and close without scripts", async ({ page }) => {
  await page.goto("/es/servicios/alquiler-gestion");
  const first = page.locator("details").first();
  await expect(first).not.toHaveAttribute("open", "");
  await first.locator("summary").click();
  await expect(first).toHaveAttribute("open", "");
  await first.locator("summary").click();
  await expect(first).not.toHaveAttribute("open", "");
});

test("service pages are translated: the head keeps its illustration in every locale", async ({
  page,
}) => {
  for (const [locale, segment, slug] of [
    ["en", "services", "property-valuation"],
    ["it", "servizi", "valutazione-immobiliare"],
    ["ca", "serveis", "valoracio-immobiliaria"],
  ] as const) {
    await page.goto(`/${locale}/${segment}/${slug}`);
    await expect(page.locator("[data-page-head] img[alt]:not([alt=''])")).toHaveCount(1);
    await expect(page.locator("#hablemos")).toBeAttached();
  }
});

test("barrio figures match the official data, with their source", async ({ page }) => {
  await page.goto("/es/vivir-en-barcelona/nou-barris/verdun");
  await expect(page.getByText("2.736", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("−36 % vs. Barcelona")).toBeVisible();
  await expect(page.getByText("62.º de 73 barrios", { exact: false })).toBeVisible();
  await expect(page.getByText("Portal de Dades", { exact: false }).first()).toBeVisible();
});

test("barrios are shown in the locale of the page", async ({ page }) => {
  await page.goto("/en/living-in-barcelona/nou-barris/verdun");
  await expect(page.getByText("Average rent")).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
});

test("untranslated prose stays out of the index and is marked as Spanish", async ({ page }) => {
  await page.goto("/en/services/property-sales-brokerage");
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1);
  await expect(page.locator("[data-page-view]")).toHaveAttribute("lang", "es");
});

test("the district map recolours by metric, shows a district and search filters the table", async ({
  page,
}) => {
  await page.goto("/es/vivir-en-barcelona");
  const first = page.locator(".zs").first();
  const before = await first.evaluate((node) => getComputedStyle(node).fill);
  await page.locator('label[for="zm-m-density"]').click();
  await expect.poll(() => first.evaluate((node) => getComputedStyle(node).fill)).not.toBe(before);
  await page.locator('label[for="zd-eixample"]').click();
  await expect(page.locator(".zp-eixample")).toBeVisible();
  await expect(page.locator(".zp-all")).toBeHidden();
  await expect(page.locator(".zk-eixample")).toHaveAttribute(
    "href",
    /\/vivir-en-barcelona\/eixample$/,
  );
  await page.locator("[data-barrio-search]").fill("verdun");
  await expect(page.locator("[data-barrio-row]:visible")).toHaveCount(1);
});

test("the lead form opens WhatsApp with the request written", async ({ page, context }) => {
  await page.goto("/es/contacto");
  await context.route("https://wa.me/**", (route) => route.abort());
  const form = page.locator("#cf");
  await form.locator('[name="nombre"]').fill("Ana");
  await form.locator('[name="telefono"]').fill("600000000");
  await form.locator('[name="mensaje"]').fill("Hola");
  await form.locator('[name="consent"]').check();
  const request = context.waitForEvent("request", (candidate) =>
    candidate.url().startsWith("https://wa.me/"),
  );
  await form.locator('button[type="submit"]').click();
  expect(decodeURIComponent((await request).url())).toContain("Ana");
  await expect(form.locator("[data-lead-status]")).toBeVisible();
});

test("district barrios appear only after choosing the district", async ({ page }) => {
  await page.goto("/es/mi-busqueda");
  const raval = page.locator('input[name="barrio"][value="el-raval"]');
  await expect(raval.locator("xpath=ancestor::*[@data-when]")).toBeHidden();
  await page.locator('input[name="distrito"][value="ciutat-vella"]').check({ force: true });
  await expect(raval.locator("xpath=ancestor::*[@data-when]")).toBeVisible();
});

test("the about page keeps its paper head, its in-page anchors and 'where we are'", async ({
  page,
}) => {
  await page.goto("/es/nosotros");
  await expect(page.locator("[data-page-head] img")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  for (const id of [
    "historia",
    "experiencia",
    "filosofia",
    "como-trabajamos",
    "milla",
    "colaboraciones",
  ]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await page.goto("/es/nosotros#donde-estamos");
  await expect(page.locator("#donde-estamos")).toBeInViewport();
});

test("the contact page lists the four contact ways above the form", async ({ page }) => {
  await page.goto("/es/contacto");
  await expect(page.locator("#formas li")).toHaveCount(4);
  await expect(page.locator("#formulario #cf")).toBeVisible();
  await expect(page.locator("#preguntas")).toHaveCount(0);
  await page.locator("#formas a", { hasText: "Cuéntanos" }).click();
  await expect(page.locator("#formulario")).toBeInViewport();
});
