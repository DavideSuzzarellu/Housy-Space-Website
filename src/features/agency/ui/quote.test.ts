import { describe, expect, it } from "vitest";
import { splitQuote } from "./quote";

describe("splitQuote", () => {
  it("separates an opening inverted mark", () => {
    expect(splitQuote("¡No te preocupes,")).toEqual({
      lead: "¡",
      body: "No te preocupes,",
      trail: "",
    });
  });

  it("separates a closing exclamation mark", () => {
    expect(splitQuote("yo me encargo!")).toEqual({ lead: "", body: "yo me encargo", trail: "!" });
  });

  it("leaves text without edge marks alone and joins back to the original", () => {
    expect(splitQuote("Don't worry,")).toEqual({ lead: "", body: "Don't worry,", trail: "" });
    const parts = splitQuote("¿Hablamos?");
    expect(`${parts.lead}${parts.body}${parts.trail}`).toBe("¿Hablamos?");
  });
});
