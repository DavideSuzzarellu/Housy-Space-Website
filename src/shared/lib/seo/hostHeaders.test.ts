import { describe, expect, it } from "vitest";
import { renderHeadersFile } from "./hostHeaders";

describe("renderHeadersFile", () => {
  it("applies two safe headers to every path and sets no CSP", () => {
    expect(renderHeadersFile()).toBe(
      "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n",
    );
  });
});
