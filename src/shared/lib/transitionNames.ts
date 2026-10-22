import { slugify } from "./slugify";

/** Parts of a property that morph between the listing card and the detail page. */
export type PropertyTransitionPart = "image" | "title" | "price";

/**
 * Single source for property `transition:name` values (AGENTS.md §3.3).
 * Output is deterministic and only contains characters valid in a CSS identifier.
 */
export function propertyTransitionName(ref: string, part: PropertyTransitionPart): string {
  const safeRef = slugify(ref);
  if (safeRef === "") {
    throw new RangeError("propertyTransitionName: ref has no usable characters");
  }
  return `property-${safeRef}-${part}`;
}

export type PropertyTransitionNames = Readonly<Record<PropertyTransitionPart, string>>;

/** The three morph names of one property (card ↔ detail hero). */
export function propertyTransitionNames(ref: string): PropertyTransitionNames {
  return {
    image: propertyTransitionName(ref, "image"),
    title: propertyTransitionName(ref, "title"),
    price: propertyTransitionName(ref, "price"),
  };
}

/**
 * `view-transition-class` shared by every property image morph, so the snapshot keeps
 * `object-fit: cover` while the card and the hero have different aspect ratios (motion.css).
 */
export const PROPERTY_IMAGE_TRANSITION_CLASS = "property-image";

/**
 * The fixed header keeps its own snapshot without cross-fading (no flicker between pages).
 * It is not persisted: its locale links change per page (ROADMAP decisions log).
 */
export const SITE_HEADER_TRANSITION_NAME = "site-header";

/**
 * Refs that morph between the outgoing and the incoming page (both render them).
 * Used to show those elements immediately instead of waiting for the scroll reveal.
 */
export function sharedMorphRefs(
  outgoing: Iterable<string>,
  incoming: Iterable<string>,
): Set<string> {
  const before = new Set([...outgoing].map((ref) => slugify(ref)));
  return new Set([...incoming].map((ref) => slugify(ref)).filter((ref) => before.has(ref)));
}
