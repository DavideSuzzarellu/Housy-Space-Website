import { describe, expect, it } from "vitest";
import { DISTRICTS, getDistrict } from "./districts";

describe("DISTRICTS", () => {
  it("has the 10 districts and 73 barrios of Barcelona", () => {
    expect(DISTRICTS).toHaveLength(10);
    expect(DISTRICTS.reduce((sum, district) => sum + district.barrioCount, 0)).toBe(73);
  });

  it("slugifies official names to ASCII", () => {
    expect(DISTRICTS.map((district) => district.slug)).toEqual([
      "ciutat-vella",
      "eixample",
      "sants-montjuic",
      "les-corts",
      "sarria-sant-gervasi",
      "gracia",
      "horta-guinardo",
      "nou-barris",
      "sant-andreu",
      "sant-marti",
    ]);
  });

  it("finds a district by slug", () => {
    expect(getDistrict("gracia")?.name).toBe("Gràcia");
    expect(getDistrict("nowhere")).toBeUndefined();
  });
});
