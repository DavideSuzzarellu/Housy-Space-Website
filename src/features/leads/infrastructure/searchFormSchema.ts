import { z } from "astro/zod";

/**
 * Server-side schema of a "Mi búsqueda" request, for the day the form has a destination (AGENTS.md
 * section 3.2 TODO). The browser cannot import Zod (93 KB gzip), so it runs the plain functions of
 * `domain/searchWizard.ts`; `searchFormSchema.test.ts` feeds both the same inputs so they cannot drift.
 */
const amount = z.number().int().nonnegative().nullable();

export const searchFormSchema = z
  .object({
    operation: z.enum(["venta", "alquiler"]),
    priceMin: amount,
    priceMax: amount,
    areaMin: amount,
    areaMax: amount,
    name: z.string().trim().min(2),
    email: z
      .string()
      .trim()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s().-]{9,22}$/)
      .refine((value) => {
        const digits = value.replace(/\D/g, "").length;
        return digits >= 9 && digits <= 15;
      }),
    consentData: z.literal(true),
    commercial: z.boolean(),
    channels: z.array(z.string()),
  })
  .refine((v) => v.priceMin === null || v.priceMax === null || v.priceMin <= v.priceMax, {
    path: ["priceMax"],
  })
  .refine((v) => v.areaMin === null || v.areaMax === null || v.areaMin <= v.areaMax, {
    path: ["areaMax"],
  })
  .refine((v) => !v.commercial || v.channels.length > 0, { path: ["channels"] });
