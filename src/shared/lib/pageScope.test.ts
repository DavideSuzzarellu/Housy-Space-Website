import { afterEach, describe, expect, it, vi } from "vitest";
import { pageSignal } from "./pageScope";

describe("pageSignal", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("aborts on the next astro:before-swap, once, and not before", () => {
    const fakeDocument = new EventTarget();
    vi.stubGlobal("document", fakeDocument);

    const signal = pageSignal();
    expect(signal.aborted).toBe(false);

    fakeDocument.dispatchEvent(new Event("astro:before-swap"));
    expect(signal.aborted).toBe(true);

    // A later page gets its own signal: the swap of the previous one does not abort it.
    const next = pageSignal();
    expect(next.aborted).toBe(false);
  });

  it("removes listeners registered with the signal when the page is swapped", () => {
    const fakeDocument = new EventTarget();
    vi.stubGlobal("document", fakeDocument);
    const handler = vi.fn();

    fakeDocument.addEventListener("pointerdown", handler, { signal: pageSignal() });
    fakeDocument.dispatchEvent(new Event("pointerdown"));
    fakeDocument.dispatchEvent(new Event("astro:before-swap"));
    fakeDocument.dispatchEvent(new Event("pointerdown"));

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
