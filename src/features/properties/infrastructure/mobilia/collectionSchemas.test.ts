import { describe, expect, it } from "vitest";
import inmueblesFixture from "../../../../../tests/fixtures/mobilia/inmuebles.json";
import { agentSchema, propertySchema } from "./collectionSchemas";
import { mapInmueble } from "./mapper";
import { mobiliaInmuebleSchema } from "./schemas";

describe("propertySchema (content-layer entry)", () => {
  it("accepts every mapped fixture unchanged (JSON round trip)", () => {
    for (const item of inmueblesFixture.elementos) {
      const property = mapInmueble(mobiliaInmuebleSchema.parse(item));
      const stored: unknown = JSON.parse(JSON.stringify(property));
      expect(propertySchema.parse(stored)).toEqual(property);
    }
  });

  it("rejects non-https photo URLs and unknown operations", () => {
    const property = mapInmueble(mobiliaInmuebleSchema.parse(inmueblesFixture.elementos[0]));
    expect(
      propertySchema.safeParse({ ...property, photos: [{ url: "http://x.y/z", caption: {} }] })
        .success,
    ).toBe(false);
    expect(propertySchema.safeParse({ ...property, operations: ["auction"] }).success).toBe(false);
  });
});

describe("agentSchema", () => {
  it("requires a positive id and a name", () => {
    expect(agentSchema.safeParse({ id: 1, name: "Ana" }).success).toBe(true);
    expect(agentSchema.safeParse({ id: 0, name: "Ana" }).success).toBe(false);
    expect(agentSchema.safeParse({ id: 1, name: "" }).success).toBe(false);
  });
});
