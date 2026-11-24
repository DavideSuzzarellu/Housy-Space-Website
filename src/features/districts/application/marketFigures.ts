import type { AllowedFigures } from "@/features/districts/domain/marketFigures";
import type { MarketData } from "@/features/districts/infrastructure/marketSchema";

/**
 * Every "€/m²" and "€/mes" value the official market data contains: current figures, rents per
 * m², historical series and provisional values, for the city, its districts and its barrios.
 */
export function allowedMarketFigures(market: MarketData): AllowedFigures {
  const perM2: number[] = [];
  const perMonth: number[] = [];
  const series = (place: MarketData["city"] | MarketData["districts"][number]) => {
    perM2.push(place.sale, ...place.saleSeries.map(([, value]) => value));
    perMonth.push(place.rent, ...place.rentSeries.map(([, value]) => value));
  };
  series(market.city);
  for (const district of market.districts) {
    series(district);
    perM2.push(district.rentPerM2);
  }
  for (const barrio of market.barrios) {
    series(barrio);
    perM2.push(barrio.rentPerM2);
    if (barrio.saleProvisional) perM2.push(barrio.saleProvisional.y);
    if (barrio.rentProvisional) perMonth.push(barrio.rentProvisional.y);
  }
  return { perM2, perMonth };
}
