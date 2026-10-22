import { getCollection } from "astro:content";
import type { Property } from "../domain/property";
import { createPropertyQueries } from "./propertyQueries";

/** Production binding of the property use cases to the `properties` content collection. */
async function propertiesFromCollection(): Promise<Property[]> {
  const entries = await getCollection("properties");
  return entries.map((entry) => entry.data);
}

export const { getFeaturedProperties, getPropertyByRef, getSimilarProperties, listProperties } =
  createPropertyQueries(propertiesFromCollection);

export type { PropertyLookup } from "./propertyQueries";
