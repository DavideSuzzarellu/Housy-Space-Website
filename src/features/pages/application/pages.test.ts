import { describe, expect, it, vi } from "vitest";

vi.mock("astro:content", () => ({ getEntry: vi.fn() }));

const { groupItems } = await import("./pages");

describe("groupItems", () => {
  it("merges consecutive cards and keeps the rest in order", () => {
    const units = groupItems([
      { kind: "h2" },
      { kind: "card" },
      { kind: "card" },
      { kind: "p" },
      { kind: "card" },
    ]);
    expect(units.map((unit) => (unit.type === "group" ? unit.items.length : unit.type))).toEqual([
      "single",
      2,
      "single",
      1,
    ]);
  });

  it("does not merge different grouped kinds", () => {
    const units = groupItems([{ kind: "card" }, { kind: "faq" }]);
    expect(units).toHaveLength(2);
  });
});
