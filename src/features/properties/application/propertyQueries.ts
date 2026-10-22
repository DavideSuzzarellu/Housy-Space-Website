import {
  selectFeatured,
  toPropertyRef,
  type DetailOperation,
  type Operation,
  type Property,
} from "../domain/property";
import { selectSimilar } from "../domain/similar";

/** Port: where the catalog comes from (content collection in production, fakes in tests). */
export type PropertySource = () => Promise<readonly Property[]>;

export type PropertyLookup =
  | { readonly ok: true; readonly property: Property }
  | { readonly ok: false; readonly error: "not-found" };

export interface FeaturedOptions {
  readonly limit?: number;
}

export interface ListOptions {
  readonly operation?: Operation;
}

/** Home page shows three featured listings (UI proposal §11.1). */
export const DEFAULT_FEATURED_LIMIT = 3;

export function createPropertyQueries(source: PropertySource) {
  return {
    async getFeaturedProperties(options: FeaturedOptions = {}): Promise<Property[]> {
      return selectFeatured(await source(), options.limit ?? DEFAULT_FEATURED_LIMIT);
    },

    async getPropertyByRef(rawRef: string): Promise<PropertyLookup> {
      if (rawRef.trim() === "") return { ok: false, error: "not-found" };
      const ref = toPropertyRef(rawRef);
      const property = (await source()).find((candidate) => candidate.ref === ref);
      return property === undefined ? { ok: false, error: "not-found" } : { ok: true, property };
    },

    /** Similar listings for a detail page; empty when the ref is unknown. */
    async getSimilarProperties(
      rawRef: string,
      operation: DetailOperation,
      limit?: number,
    ): Promise<Property[]> {
      if (rawRef.trim() === "") return [];
      const ref = toPropertyRef(rawRef);
      const all = await source();
      const current = all.find((candidate) => candidate.ref === ref);
      return current === undefined ? [] : selectSimilar(current, all, operation, limit);
    },

    async listProperties(options: ListOptions = {}): Promise<Property[]> {
      const { operation } = options;
      const all = await source();
      return operation === undefined
        ? [...all]
        : all.filter((property) => property.operations.includes(operation));
    },
  };
}
