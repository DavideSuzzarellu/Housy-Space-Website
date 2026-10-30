import { describe, expect, it } from "vitest";
import { latestTestimonials } from "./review";

const entry = (id: string, date: string) => ({ id, data: { date: new Date(date) } });

describe("latestTestimonials", () => {
  it("returns the newest first, up to the limit", () => {
    const result = latestTestimonials(
      [entry("old", "2023-07-05"), entry("new", "2026-05-06"), entry("mid", "2026-04-14")],
      2,
    );
    expect(result.map((item) => item.id)).toEqual(["new", "mid"]);
  });
});
