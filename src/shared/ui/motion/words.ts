import { motionAllowed } from "./reveal";

/**
 * Word-by-word headline reveal (reference `[data-rv=words]`). Each `[data-words-line]` child of
 * a `[data-reveal="words"]` heading is split into inline-block `.w` spans, indexed per line in
 * `--i`; `data-words-line="rise"` (default) lifts and un-blurs the words, `"type"` wipes them in.
 * Whitespace text nodes are kept between the spans, so the heading text (and what a screen
 * reader announces) is exactly the original sentence.
 */

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

function splitLine(line: Element): void {
  let index = 0;
  for (const node of [...line.childNodes]) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const fragment = document.createDocumentFragment();
    for (const token of tokenizeWords(node.textContent ?? "")) {
      if (!token.isWord) {
        fragment.append(token.text);
        continue;
      }
      const word = document.createElement("span");
      word.className = "w";
      word.style.setProperty("--i", String(index++));
      word.textContent = token.text;
      fragment.append(word);
    }
    node.replaceWith(fragment);
  }
}

export function initWords(): void {
  if (!motionAllowed()) return;
  for (const heading of document.querySelectorAll(
    '[data-reveal="words"]:not([data-words-ready])',
  )) {
    const lines = heading.querySelectorAll("[data-words-line]");
    for (const line of lines.length > 0 ? lines : [heading]) splitLine(line);
    heading.setAttribute("data-words-ready", "");
  }
}
