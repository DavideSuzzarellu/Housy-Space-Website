/** Widens string literals to `string` so every locale can satisfy the `es` shape. */
export type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};
