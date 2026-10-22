declare const brand: unique symbol;

/**
 * Nominal ("branded") type: a `T` that is only assignable from values created by
 * a domain constructor (AGENTS.md §8.1). The brand exists at type level only.
 */
export type Brand<T, B extends string> = T & { readonly [brand]: B };
