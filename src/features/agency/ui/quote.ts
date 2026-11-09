export interface QuoteParts {
  /** Opening inverted mark (`¡`, `¿`), drawn hanging outside the text block. */
  lead: string;
  body: string;
  /** Closing `!` or `?`. */
  trail: string;
}

/** Splits the edge punctuation of a motto line from its words; the three parts joined give the input. */
export function splitQuote(text: string): QuoteParts {
  const match = /^([¡¿]?)(.*?)([!?]?)$/su.exec(text);
  return { lead: match?.[1] ?? "", body: match?.[2] ?? text, trail: match?.[3] ?? "" };
}
