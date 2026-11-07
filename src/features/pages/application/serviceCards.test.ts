import { describe, expect, it } from "vitest";
import { SERVICE_KEYS } from "@/shared/i18n/services";
import { SERVICE_GROUPS } from "./serviceCards";

describe("SERVICE_GROUPS", () => {
  it("places every service exactly once", () => {
    const placed = [...SERVICE_GROUPS.main, ...SERVICE_GROUPS.others];
    expect([...placed].sort()).toEqual([...SERVICE_KEYS].sort());
    expect(new Set(placed).size).toBe(placed.length);
  });

  it("leads with the sale service, as the services board", () => {
    expect(SERVICE_GROUPS.main[0]).toBe("saleBrokerage");
  });
});
