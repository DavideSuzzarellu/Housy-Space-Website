import { describe, expect, it } from "vitest";
import { LOCALES } from "./config";
import { getDictionary } from "./index";

/** Collects every leaf key path (e.g. "nav.properties") of a nested dictionary. */
function leafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

function leafValues(value: unknown): unknown[] {
  if (typeof value !== "object" || value === null) return [value];
  return Object.values(value).flatMap(leafValues);
}

describe("i18n dictionaries", () => {
  const reference = leafPaths(getDictionary("es")).sort();

  it.each(LOCALES)("%s has exactly the same keys as es", (locale) => {
    expect(leafPaths(getDictionary(locale)).sort()).toEqual(reference);
  });

  it.each(LOCALES)("%s has no empty strings", (locale) => {
    for (const value of leafValues(getDictionary(locale))) {
      expect(typeof value).toBe("string");
      expect(value).not.toBe("");
    }
  });

  it.each(LOCALES)("%s names every supported language", (locale) => {
    expect(Object.keys(getDictionary(locale).languageNames).sort()).toEqual([...LOCALES].sort());
  });
});
