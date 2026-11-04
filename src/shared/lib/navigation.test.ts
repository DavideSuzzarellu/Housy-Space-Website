import { describe, expect, it } from "vitest";
import { LOCALES } from "@/shared/i18n/config";
import { getFooterNavigation, getMainNavigation } from "./navigation";

describe("getMainNavigation", () => {
  it("lists the 8 main entries of proposal v3 in order (es)", () => {
    expect(getMainNavigation("es").map((item) => item.label)).toEqual([
      "Propiedades",
      "Servicios",
      "Vivir en Barcelona",
      "Mi búsqueda",
      "Nosotros",
      "Blog",
      "Dónde estamos",
      "Contacto",
    ]);
  });

  it("links My search to its route and Where we are to the about page anchor", () => {
    const items = getMainNavigation("es");
    expect(items[3]?.href).toBe("/es/mi-busqueda");
    expect(items[6]?.href).toBe("/es/nosotros#donde-estamos");
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

  it("marks Blog, Where we are and Contact as secondary (one smaller row in the drawer)", () => {
    expect(
      getMainNavigation("es")
        .filter((item) => item.secondary)
        .map((item) => item.label),
    ).toEqual(["Blog", "Dónde estamos", "Contacto"]);
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
  it("has the Explore, Owners and HousySpace columns of proposal v3", () => {
    const columns = getFooterNavigation("es");
    expect(columns.map((column) => column.title)).toEqual([
      "Explorar",
      "Propietarios",
      "HousySpace",
    ]);
    expect(columns[0]?.links.map((link) => link.href)).toEqual([
      "/es/venta",
      "/es#servicios",
      "/es/vivir-en-barcelona",
      "/es/mi-busqueda",
      "/es/blog",
    ]);
    expect(columns[1]?.links.map((link) => link.href)).toEqual(["/es/vender"]);
    expect(columns[2]?.links.map((link) => link.href)).toEqual([
      "/es/nosotros",
      "/es/contacto",
      "/es/nosotros#donde-estamos",
      "/es/datos",
      "/es/aviso-legal",
      "/es/privacidad",
      "/es/cookies",
    ]);
  });
});
