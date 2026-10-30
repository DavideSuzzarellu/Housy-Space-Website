import { z } from "astro/zod";

/**
 * Editorial pages (services, about, contact, legal, guides...), one JSON file per page and locale
 * in `src/content/pages/{key}.{locale}.json`. A page is a head plus sections, and a section is a
 * flat list of items rendered in order, so a new layout never needs a new schema branch.
 * Text fields accept the small inline syntax of `shared/lib/inline.ts`, never HTML.
 */

const text = z.string().trim().min(1);

const optionSchema = z.object({ value: text, label: text, hint: text.optional() }).strict();

const inputFieldSchema = z
  .object({
    kind: z.literal("field"),
    name: text,
    label: text,
    type: z.enum(["text", "email", "tel", "number", "select", "textarea", "consent"]),
    required: z.boolean(),
    full: z.boolean(),
    options: z.array(text).optional(),
    placeholder: text.optional(),
  })
  .strict();

const formLeafSchema = z.discriminatedUnion("kind", [
  inputFieldSchema,
  z
    .object({
      kind: z.literal("chips"),
      name: text,
      radio: z.boolean(),
      required: z.boolean(),
      options: z.array(optionSchema).min(1),
      label: text.optional(),
      /** Only shown once this value of the `distrito` chips is selected. */
      when: text.optional(),
    })
    .strict(),
  z.object({ kind: z.literal("note"), text }).strict(),
  z.object({ kind: z.literal("details"), summary: text, text }).strict(),
  z.object({ kind: z.literal("submit"), label: text }).strict(),
]);

const formFieldSchema = z.union([
  formLeafSchema,
  z
    .object({
      kind: z.literal("group"),
      title: text,
      hint: text.optional(),
      fields: z.array(formLeafSchema),
    })
    .strict(),
]);

export type FormField = z.infer<typeof formFieldSchema>;
export type FormLeaf = z.infer<typeof formLeafSchema>;

const textItem = <K extends string>(kind: K) => z.object({ kind: z.literal(kind), text }).strict();
const listItems = z.array(z.object({ title: z.string(), text: z.string() }).strict());

/** `image` is Astro's `image()` from the collection context; tests pass a stand-in. */
export function pageSchema<I extends z.ZodType>(image: () => I) {
  const leaf = z.discriminatedUnion("kind", [
    textItem("tag"),
    textItem("h2"),
    textItem("h3"),
    textItem("p"),
    textItem("lead"),
    textItem("big"),
    textItem("bandQuote"),
    textItem("note"),
    textItem("pending"),
    textItem("quote"),
    z.object({ kind: z.literal("faq"), q: text, a: text }).strict(),
    z.object({ kind: z.literal("list"), ordered: z.boolean(), items: listItems }).strict(),
    z.object({ kind: z.literal("steps"), items: listItems }).strict(),
    z
      .object({
        kind: z.literal("buttons"),
        items: z.array(z.object({ label: text, href: text, solid: z.boolean() }).strict()),
      })
      .strict(),
    z
      .object({
        kind: z.literal("table"),
        head: z.array(z.string()),
        rows: z.array(z.array(z.string())),
      })
      .strict(),
    z.object({ kind: z.literal("valuator"), title: text }).strict(),
    z.object({ kind: z.literal("image"), src: image() }).strict(),
    z
      .object({
        kind: z.literal("form"),
        id: text,
        mode: z.enum(["whatsapp", "email"]),
        intro: text.optional(),
        fields: z.array(formFieldSchema),
      })
      .strict(),
  ]);
  const item = z.union([
    leaf,
    z.object({ kind: z.literal("card"), items: z.array(leaf) }).strict(),
    z.object({ kind: z.literal("article"), items: z.array(leaf) }).strict(),
  ]);
  return z
    .object({
      title: text,
      description: z.string(),
      head: z.object({ heading: text, photo: z.boolean(), items: z.array(leaf) }).strict(),
      sections: z.array(
        z
          .object({
            id: text.optional(),
            surface: z.enum(["paper", "stone", "dark"]),
            band: z.boolean(),
            items: z.array(item),
          })
          .strict(),
      ),
    })
    .strict();
}
