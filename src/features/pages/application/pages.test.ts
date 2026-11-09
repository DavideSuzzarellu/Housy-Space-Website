import { describe, expect, it, vi } from "vitest";

vi.mock("astro:content", () => ({ getEntry: vi.fn() }));

const { groupItems, splitBlockHead } = await import("./pages");

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

describe("splitBlockHead", () => {
  it("takes the leading tag, h2 and lead as the heading block", () => {
    const { head, body } = splitBlockHead([
      { kind: "tag" },
      { kind: "h2" },
      { kind: "lead" },
      { kind: "list" },
      { kind: "lead" },
    ]);
    expect(head.map((item) => item.kind)).toEqual(["tag", "h2", "lead"]);
    expect(body.map((item) => item.kind)).toEqual(["list", "lead"]);
  });

  it("leaves a section that opens with other content without a heading block", () => {
    const { head, body } = splitBlockHead([{ kind: "big" }, { kind: "p" }]);
    expect(head).toEqual([]);
    expect(body).toHaveLength(2);
  });
});
