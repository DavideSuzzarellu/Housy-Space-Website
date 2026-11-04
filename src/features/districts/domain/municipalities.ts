interface MunicipalityRef {
  readonly slug: string;
  readonly name: string;
  readonly comarca: string;
}

/** The other municipalities of the comarca of `slug`, sorted by name (Catalan collation). */
export function neighboursInComarca<T extends MunicipalityRef>(
  list: readonly T[],
  slug: string,
): T[] {
  const current = list.find((item) => item.slug === slug);
  if (current === undefined) return [];
  return list
    .filter((item) => item.comarca === current.comarca && item.slug !== slug)
    .sort((a, b) => a.name.localeCompare(b.name, "ca"));
}
