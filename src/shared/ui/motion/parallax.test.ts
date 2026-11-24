import { describe, expect, it } from "vitest";
import { parallaxOffset } from "./parallax";

describe("parallaxOffset", () => {
  it("is zero when the host is centred in the viewport", () => {
    expect(parallaxOffset(300, 400, 1000, 0.08)).toBeCloseTo(0);
  });

  it("moves against the scroll and is capped at 5.5 % of the host height", () => {
    expect(parallaxOffset(500, 400, 1000, 0.08)).toBeCloseTo(-16);
    expect(parallaxOffset(2000, 400, 1000, 0.08)).toBeCloseTo(-22);
    expect(parallaxOffset(-2000, 400, 1000, 0.08)).toBeCloseTo(22);
  });
});
