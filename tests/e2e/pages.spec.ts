import { expect, test, type Page } from "@playwright/test";
import { getServiceSlug } from "../../src/shared/i18n/services";
import { skipIntro } from "./support";

test.beforeEach(async ({ page }) => {
  await skipIntro(page);
});

const PAGES = [
  ["/es/servicios/venta-estrategica", "Compraventa e intermediación inmobiliaria"],
  ["/es/servicios/asesoramiento-juridico-fiscal", "Asesoramiento jurídico y fiscal"],
  ["/es/nosotros", "Mucho más que una inmobiliaria"],
  ["/es/contacto", "Hablemos"],
  ["/es/mi-busqueda", "Tu próximo hogar empieza aquí"],
  ["/es/valoracion", "El valor de tu vivienda"],
  ["/es/blog", "El Blog"],
  ["/es/guia-internacional", "Comprar en Barcelona desde el extranjero"],
  ["/es/datos", "Estado de los datos"],
  ["/es/aviso-legal", "Aviso legal"],
  ["/es/privacidad", "Política de privacidad"],
  ["/es/cookies", "Política de cookies"],
  ["/es/zonas/barcelona", "Barcelona, barrio a barrio"],
  ["/es/zonas/barcelona/distritos/gracia", "Gràcia"],
  ["/es/zonas/barcelona/verdun", "Verdun"],
] as const;

for (const [url, heading] of PAGES) {
  test(`${url} renders with its heading`, async ({ page }) => {
    const response = await page.goto(url);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toContainText(heading);
  });
}

const SERVICES = [
  "venta-estrategica",
  "valoracion",
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
    await expect(head.getByRole("heading", { level: 1 })).toHaveCount(1);
    // The head illustration (valuation has none) is the only eager image and has a text alternative.
    if (service !== "valoracion") {
      await expect(head.locator("img[fetchpriority='high']")).toHaveCount(1);
      await expect(head.locator("img[alt]:not([alt=''])")).toHaveCount(1);
    }
    // The page closes with its own "Hablemos" block, which links to the other seven services and the contact ways.
    await expect(page.locator("#hablemos")).toBeAttached();
    expect(await page.locator("#hablemos a").count()).toBeGreaterThanOrEqual(7);
    // The footer's own "¡Hablemos!" row is hidden: the page closes with its own.
    await expect(page.locator("[data-footer-cta]")).toBeHidden();
  });
}

test("/es/servicios is a real page with the 8 services, 6 situations and a contact block", async ({
  page,
}) => {
  await page.goto("/es/servicios");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("servicios");
  await expect(
    page.locator("#propietarios li a, #compradores li a, #especializados li a"),
  ).toHaveCount(8);
  await expect(page.locator("#situaciones li a")).toHaveCount(6);
  await expect(page.locator("#asesoramiento ol li")).toHaveCount(4);
  await expect(page.locator("#hablemos a")).toHaveCount(4);
});

test("the compraventa page lists eight steps, eight inclusions and five exclusivity reasons", async ({
  page,
}) => {
  await page.goto("/es/servicios/venta-estrategica");
  await expect(page.locator("#pasos ol > li")).toHaveCount(8);
  await expect(page.locator("#incluye ul > li")).toHaveCount(8);
  await expect(page.locator("#exclusiva ol > li")).toHaveCount(5);
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
  for (const [locale, segment] of [
    ["en", "services"],
    ["it", "servizi"],
    ["ca", "serveis"],
  ] as const) {
    await page.goto(`/${locale}/${segment}/${getServiceSlug("saleBrokerage", locale)}`);
    await expect(page.locator("[data-page-head] img[alt]:not([alt=''])")).toHaveCount(1);
    await expect(page.locator("#hablemos")).toBeAttached();
  }
});

test("barrio figures match the official data, with their source", async ({ page }) => {
  await page.goto("/es/zonas/barcelona/verdun");
  await expect(page.getByText("2.736", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("−36 % vs. Barcelona")).toBeVisible();
  await expect(page.getByText("62.º de 73 barrios", { exact: false })).toBeVisible();
  await expect(page.getByText("Portal de Dades", { exact: false }).first()).toBeVisible();
});

test("barrios are shown in the locale of the page", async ({ page }) => {
  await page.goto("/en/zones/barcelona/verdun");
  await expect(page.getByText("Average rent", { exact: true })).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
});

test("a translated service page is indexable and is not marked as Spanish", async ({ page }) => {
  // Every page ships in the 4 locales (AGENTS.md section 3.2): the Spanish fallback
  // (`lang="es"` + noindex) is only a safety net for a file not translated yet.
  await page.goto(`/en/services/${getServiceSlug("saleBrokerage", "en")}`);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
  await expect(page.locator('[data-page-view][lang="es"]')).toHaveCount(0);
});

test("the district map recolours by metric, shows a district and search lists the matching barrios", async ({
  page,
}) => {
  await page.goto("/es/zonas/barcelona");
  const first = page.locator(".zs").first();
  const before = await first.evaluate((node) => getComputedStyle(node).fill);
  // The radios sit over their labels: check the input itself.
  await page.locator("#zm-m-density").check();
  await expect.poll(() => first.evaluate((node) => getComputedStyle(node).fill)).not.toBe(before);
  await page.locator("#zd-eixample").check();
  await expect(page.locator(".zp-eixample")).toBeVisible();
  await expect(page.locator(".zp-all")).toBeHidden();
  await expect(page.locator(".zk-eixample")).toHaveAttribute(
    "href",
    /\/zonas\/barcelona\/distritos\/eixample$/,
  );
  await page.locator("#barrio-search").fill("verdun");
  await expect(page.locator('#barrio-results li[data-kind="b"]:visible')).toHaveCount(1);
});

test("'view on the map' opens the district on the map and marks the barrio", async ({ page }) => {
  await page.goto("/es/zonas/barcelona");
  await page.locator("#barrio-search").fill("verdun");
  await page.locator('#barrio-results li[data-kind="b"]:visible [data-view-map]').click();
  await expect(page.locator("#zd-nou-barris")).toBeChecked();
  await expect(page.locator('[data-barrio="verdun"][data-on]')).toHaveCount(1);
  await expect(page.locator(".zp-nou-barris")).toBeVisible();
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

test.describe("my search wizard", () => {
  const next = (page: Page) => page.locator("[data-next] button");

  test("shows one step at a time and validates the operation before moving on", async ({
    page,
  }) => {
    await page.goto("/es/mi-busqueda");
    await expect(page.locator("[data-wizard-count]")).toHaveText("Paso 1 de 5");
    await expect(page.locator("fieldset[data-step]:not([data-step-off])")).toHaveCount(1);
    await next(page).click();
    await expect(page.locator('[data-error="operation"]')).toBeVisible();
    await expect(page.locator('input[name="operacion"]').first()).toBeFocused();
    await page.locator('label:has(input[name="operacion"][value="venta"])').click();
    await next(page).click();
    await expect(page.locator("[data-wizard-count]")).toHaveText("Paso 2 de 5");
    await expect(
      page.getByRole("heading", { level: 3, name: "¿Dónde te gustaría vivir?" }),
    ).toBeFocused();
    await page.getByRole("button", { name: /Atrás/ }).click();
    await expect(page.locator("[data-wizard-count]")).toHaveText("Paso 1 de 5");
  });

  test("district barrios appear only after choosing the district", async ({ page }) => {
    await page.goto("/es/mi-busqueda");
    await page.locator('label:has(input[name="operacion"][value="venta"])').click();
    await next(page).click();
    const raval = page.locator('input[name="barrio"][value="el-raval"]');
    await expect(raval.locator("xpath=ancestor::*[@data-when]")).toBeHidden();
    await page.locator('label:has(input[name="distrito"][value="ciutat-vella"])').click();
    await expect(raval.locator("xpath=ancestor::*[@data-when]")).toBeVisible();
  });

  test("the summary follows the form and the zone search adds zones", async ({ page }) => {
    await page.goto("/es/mi-busqueda");
    const summary = page.locator("[data-wizard-summary]");
    await expect(summary).toContainText("Elige una opción");
    await page.locator('label:has(input[name="operacion"][value="alquiler"])').click();
    await expect(summary).toContainText("Alquilar");
    await next(page).click();
    await page.locator("#zone-q").fill("clot");
    await page.getByRole("option", { name: /^El Clot/ }).click();
    await expect(summary).toContainText("El Clot");
    await expect(page.locator("[data-zone-tags]")).toContainText("El Clot");
  });

  test("the last step checks the contact data before the lead form opens WhatsApp", async ({
    page,
  }) => {
    await page.goto("/es/mi-busqueda");
    await page.locator('label:has(input[name="operacion"][value="venta"])').click();
    for (let step = 0; step < 4; step += 1) await next(page).click();
    await page.getByRole("button", { name: /Guardar mi búsqueda/ }).click();
    await expect(page.locator('[data-error="name"]')).toBeVisible();
    await expect(page.locator('[data-error="consentData"]')).toBeVisible();
    await page.locator('input[name="nombre"]').fill("Ana");
    await page.locator('main input[name="email"]').fill("ana@example.com");
    await page.locator('input[name="telefono"]').fill("+34 613 084 804");
    await page.locator('label:has(input[name="c_datos"])').click();
    const request = page
      .context()
      .waitForEvent("request", (candidate) => candidate.url().startsWith("https://wa.me/"));
    await page.getByRole("button", { name: /Guardar mi búsqueda/ }).click();
    expect(decodeURIComponent((await request).url())).toContain("Ana");
  });
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

test("the contact page lists the four contact ways and two social links above the form", async ({
  page,
}) => {
  await page.goto("/es/contacto");
  const ways = page.locator("#formas li");
  await expect(ways).toHaveCount(6);
  for (const [index, way] of ["Llámanos", "WhatsApp", "Email", "Ven a vernos"].entries()) {
    await expect(ways.nth(index)).toContainText(way);
  }
  await expect(page.locator("#formulario #cf")).toBeVisible();
  await expect(page.locator("#preguntas")).toHaveCount(0);
  await page.locator("#formas a", { hasText: "Rellena el formulario" }).click();
  await expect(page.locator("#formulario")).toBeInViewport();
});
