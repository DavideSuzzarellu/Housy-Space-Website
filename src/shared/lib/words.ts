export interface WordToken {
  text: string;
  isWord: boolean;
}

/** Splits text into word and whitespace tokens; joining the tokens returns the input. */
export function tokenizeWords(text: string): WordToken[] {
  return text
    .split(/(\s+)/)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, isWord: !/^\s+$/.test(part) }));
}
