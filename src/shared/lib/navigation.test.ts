import { describe, expect, it } from "vitest";
import { LOCALES } from "@/shared/i18n/config";
import { getFooterNavigation, getMainNavigation } from "./navigation";

describe("getMainNavigation", () => {
  it("lists the 7 main entries of the UI proposal in order (es)", () => {
    expect(getMainNavigation("es").map((item) => item.label)).toEqual([
      "Propiedades",
      "Servicios",
      "Vivir en Barcelona",
      "Busco vivienda",
      "Nosotros",
      "Blog",
      "Contacto",
    ]);
  });

  it("gives Properties, Services and Living submenus", () => {
    const [properties, services, living] = getMainNavigation("es");
    expect(properties?.children.map((link) => link.label)).toEqual([
      "Todos los inmuebles",
      "En venta",
      "En alquiler",
      "Ver en el mapa",
    ]);
    expect(services?.children).toHaveLength(9);
    expect(living?.children).toHaveLength(11);
    expect(living?.children[0]?.href).toBe("/es/vivir-en-barcelona");
    expect(living?.children[2]?.href).toBe("/es/vivir-en-barcelona/eixample");
  });

  it("marks About, Blog and Contact as secondary (one smaller row in the drawer)", () => {
    expect(
      getMainNavigation("es")
        .filter((item) => item.secondary)
        .map((item) => item.label),
    ).toEqual(["Nosotros", "Blog", "Contacto"]);
  });

  it.each(LOCALES)("only builds localized internal links (%s)", (locale) => {
    const links = getMainNavigation(locale).flatMap((item) => [item, ...item.children]);
    for (const link of links) {
      expect(link.href.startsWith(`/${locale}`)).toBe(true);
      expect(link.label).not.toBe("");
    }
  });
});

describe("getFooterNavigation", () => {
  it("has the Explore, Owners and HousySpace columns", () => {
    const columns = getFooterNavigation("es");
    expect(columns.map((column) => column.title)).toEqual([
      "Explorar",
      "Propietarios",
      "HousySpace",
    ]);
    expect(columns[2]?.links.map((link) => link.href)).toEqual([
      "/es/nosotros",
      "/es/contacto",
      "/es/datos",
      "/es/aviso-legal",
      "/es/privacidad",
      "/es/cookies",
    ]);
  });
});
