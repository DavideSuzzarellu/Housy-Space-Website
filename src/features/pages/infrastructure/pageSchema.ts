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
    type: z.enum([
      "text",
      "numeric",
      "email",
      "tel",
      "number",
      "select",
      "textarea",
      "consent",
      "check",
    ]),
    required: z.boolean(),
    full: z.boolean(),
    options: z.array(text).optional(),
    placeholder: text.optional(),
    /** Budget fields: the operation unit ("(€)", "(€/mes)") is appended to the label by the wizard. */
    unit: z.boolean().optional(),
    /** Light tag after the label ("optional"). */
    suffix: text.optional(),
    /** Small print under the control. */
    small: text.optional(),
    /** Placeholder once the operation is "alquiler". */
    placeholderRent: text.optional(),
  })
  .strict();

const formLeafSchema = z.discriminatedUnion("kind", [
  inputFieldSchema,
  z
    .object({
      kind: z.literal("chips"),
      name: text,
      radio: z.boolean(),
      /** Big option cards (operation, type) instead of small chips. */
      cards: z.boolean().optional(),
      required: z.boolean(),
      options: z.array(optionSchema).min(1),
      label: text.optional(),
      /** Only shown once this value of the `distrito` chips is selected. */
      when: text.optional(),
      /** Only shown while this checkbox (by name) is ticked. */
      whenChecked: text.optional(),
      /** `sm` small chips, `sq` square number chips; default is the regular chip. */
      size: z.enum(["sm", "sq"]).optional(),
      /** Sits next to the following `half` group on wide screens (rooms / baths). */
      half: z.boolean().optional(),
      /** Each ticked chip gets an "essential" toggle; its label is this text. */
      must: text.optional(),
      /** Value that excludes the others ("indifferent"). */
      exclusive: text.optional(),
      /** Radio with a first, pre-selected "no preference" option of this label (empty value). */
      blank: text.optional(),
    })
    .strict(),
  z.object({ kind: z.literal("note"), text }).strict(),
  z.object({ kind: z.literal("question"), text }).strict(),
  z.object({ kind: z.literal("zoneSearch"), label: text, placeholder: text }).strict(),
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

/** Layouts of a service page section (reference blocks `sx-*`); the others follow from their items. */
export const SECTION_LAYOUTS = [
  "intro",
  "introLined",
  "check",
  "cards",
  "split",
  "trio",
  "sit",
  "route",
  "tax",
  "colab",
  "call",
  "cmp",
  "doc",
  "swatches",
  "stepsList",
  "valuation",
  "cta",
] as const;
export type SectionLayout = (typeof SECTION_LAYOUTS)[number];

/** `image` is Astro's `image()` from the collection context; tests pass a stand-in. */
export function pageSchema<I extends z.ZodType>(image: () => I) {
  /**
   * One entry of a list. Optional parts, by layout: `kicker` (small label above the title, or the
   * number of a report line), `href` + `cta` (the entry is a link / has an outbound link),
   * `color` (swatch of a material), `logo` (collaborator).
   */
  const listItems = z.array(
    z
      .object({
        title: z.string(),
        text: z.string(),
        kicker: text.optional(),
        href: text.optional(),
        cta: text.optional(),
        color: z
          .string()
          .regex(/^#[0-9a-f]{6}$/i)
          .optional(),
        logo: image().optional(),
      })
      .strict(),
  );
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
      head: z
        .object({
          heading: text,
          photo: z.boolean(),
          /** Service pages: transparent illustration beside the heading; `scale` = object width / canvas width. */
          illustration: z
            .object({ src: image(), alt: text, scale: z.number().gt(0).lte(1) })
            .strict()
            .optional(),
          items: z.array(leaf),
        })
        .strict(),
      sections: z.array(
        z
          .object({
            id: text.optional(),
            layout: z.enum(SECTION_LAYOUTS).optional(),
            surface: z.enum(["paper", "stone", "dark"]),
            band: z.boolean(),
            items: z.array(item),
          })
          .strict(),
      ),
    })
    .strict();
}
