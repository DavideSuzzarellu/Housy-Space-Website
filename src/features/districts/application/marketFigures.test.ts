import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { marketSchema, type MarketNumbers } from "../infrastructure/marketSchema";
import { allowedMarketFigures } from "./marketFigures";

const market: MarketNumbers = marketSchema.parse(
  JSON.parse(readFileSync("src/content/market/barcelona.json", "utf8")),
);

describe("allowedMarketFigures", () => {
  const allowed = allowedMarketFigures(market);

  it("takes sale prices from the city, districts, barrios and their series", () => {
    expect(allowed.perM2).toContain(market.city.sale);
    expect(allowed.perM2).toContain(market.districts[0]?.sale);
    expect(allowed.perM2).toContain(market.barrios[0]?.sale);
    expect(allowed.perM2).toContain(market.city.saleSeries[0]?.[1]);
    expect(allowed.perM2).toContain(2414); // a provisional barrio value
  });

  it("takes rents per month and per m² under their own unit", () => {
    expect(allowed.perMonth).toContain(market.city.rent);
    expect(allowed.perMonth).toContain(market.barrios[0]?.rent);
    expect(allowed.perM2).toContain(market.barrios[0]?.rentPerM2);
    expect(allowed.perMonth).not.toContain(market.city.sale);
  });
});
