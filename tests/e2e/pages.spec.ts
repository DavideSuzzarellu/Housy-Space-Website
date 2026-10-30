import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  ["/es/servicios/venta-estrategica", "Compraventa e intermediación inmobiliaria"],
  ["/es/servicios/asesoramiento-juridico-fiscal", "Asesoramiento jurídico y fiscal"],
  ["/es/nosotros", "Mucho más que una inmobiliaria"],
  ["/es/contacto", "Hablemos"],
  ["/es/busco-vivienda", "Busco vivienda"],
  ["/es/busqueda-a-medida", "Búsqueda a medida"],
  ["/es/valoracion", "La próxima propiedad podría ser la tuya"],
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
  await page.goto("/en/services/venta-estrategica");
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1);
  await expect(page.locator("[data-page-view]")).toHaveAttribute("lang", "es");
});

test("the map recolours by metric and search filters the table", async ({ page }) => {
  await page.goto("/es/vivir-en-barcelona");
  const first = page.locator("path[data-slug]").first();
  const before = await first.evaluate((node) => node.style.fill);
  await page.locator('[data-metric="density"]').click();
  await expect.poll(() => first.evaluate((node) => node.style.fill)).not.toBe(before);
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
  await page.goto("/es/busco-vivienda");
  const raval = page.locator('input[name="barrio"][value="el-raval"]');
  await expect(raval.locator("xpath=ancestor::*[@data-when]")).toBeHidden();
  await page.locator('input[name="distrito"][value="ciutat-vella"]').check({ force: true });
  await expect(raval.locator("xpath=ancestor::*[@data-when]")).toBeVisible();
});
