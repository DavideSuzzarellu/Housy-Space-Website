import { getOperationPrice, type DetailOperation, type Property } from "./property";

/** "Similar properties" on the detail page (AGENTS.md §6 item 3). */
export const DEFAULT_SIMILAR_LIMIT = 3;

function zoneKey(property: Property): string | undefined {
  const zone = property.location?.zone?.trim().toLocaleLowerCase("es");
  return zone === undefined || zone === "" ? undefined : zone;
}

function publicAmount(property: Property, operation: DetailOperation): number | undefined {
  const price = getOperationPrice(property, operation);
  return price?.kind === "amount" ? price.amount : undefined;
}

/** Relative price distance; listings without a public price rank last. */
function priceDistance(reference: number | undefined, candidate: number | undefined): number {
  if (candidate === undefined) return Number.POSITIVE_INFINITY;
  if (reference === undefined || reference === 0) return Number.MAX_VALUE;
  return Math.abs(candidate - reference) / reference;
}

/**
 * Same operation, never the current property and never the same ref twice (so the
 * shared-element transition names stay unique on the page). Ranked by same zone first,
 * then closest price, then most recently updated.
 */
export function selectSimilar(
  current: Property,
  candidates: readonly Property[],
  operation: DetailOperation,
  limit: number = DEFAULT_SIMILAR_LIMIT,
): Property[] {
  const zone = zoneKey(current);
  const referencePrice = publicAmount(current, operation);
  const seen = new Set([current.ref]);
  const pool: Property[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.ref) || !candidate.operations.includes(operation)) continue;
    seen.add(candidate.ref);
    pool.push(candidate);
  }

  const rank = (property: Property) => ({
    sameZone: zone !== undefined && zoneKey(property) === zone ? 0 : 1,
    distance: priceDistance(referencePrice, publicAmount(property, operation)),
  });

  return pool
    .map((property) => ({ property, ...rank(property) }))
    .sort(
      (a, b) =>
        a.sameZone - b.sameZone ||
        a.distance - b.distance ||
        b.property.updatedAt.localeCompare(a.property.updatedAt) ||
        a.property.ref.localeCompare(b.property.ref),
    )
    .slice(0, Math.max(0, limit))
    .map(({ property }) => property);
}
