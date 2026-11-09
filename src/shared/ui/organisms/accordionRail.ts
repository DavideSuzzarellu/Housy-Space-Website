/** Index of the panel `step` positions away, wrapping around both ends. */
export function wrapIndex(index: number, step: number, count: number): number {
  return (((index + step) % count) + count) % count;
}

/**
 * Position of a panel relative to the open one, going round the circle: -side..side for the
 * visible ones (0 = open), `"hl"` / `"hr"` for those hidden on the left / right.
 */
export function panelPosition(
  index: number,
  active: number,
  count: number,
  side: number,
): number | "hl" | "hr" {
  const half = Math.floor(count / 2);
  const rel = ((((index - active + count + half) % count) + count) % count) - half;
  if (Math.abs(rel) <= side) return rel;
  return rel < 0 ? "hl" : "hr";
}

/** A neighbour opens after the mouse rests on it this long (reference `acordeon.js`). */
export const HOVER_DELAY_MS = 130;
/** Minimum time between two switches, so changes never chain with a still mouse. */
export const MIN_SWITCH_GAP_MS = 700;
const MOVE_THRESHOLD_PX = 4;

/** True for a real mouse movement, not the layout shifting under a still pointer. */
export function pointerMoved(dx: number, dy: number): boolean {
  return Math.abs(dx) + Math.abs(dy) >= MOVE_THRESHOLD_PX;
}

export interface HoverIntentInput {
  pointerMoved: boolean;
  /** Panel under the pointer, -1 when none. */
  targetIndex: number;
  currentIndex: number;
  /** Panel whose switch is already armed, -1 when none. */
  pendingIndex: number;
  now: number;
  lastSwitch: number;
}

/** What a mouse move over the carousel means: arm a switch, cancel the armed one, or nothing. */
export function hoverIntent(input: HoverIntentInput): "arm" | "clear" | "ignore" {
  if (input.targetIndex < 0 || input.targetIndex === input.currentIndex) return "clear";
  if (!input.pointerMoved || input.targetIndex === input.pendingIndex) return "ignore";
  if (input.now - input.lastSwitch < MIN_SWITCH_GAP_MS) return "ignore";
  return "arm";
}

export interface HoldInput {
  pointerInside: boolean;
  touching: boolean;
  keyboardFocus: boolean;
  offscreen: boolean;
  tabHidden: boolean;
  userPaused: boolean;
}

/** Auto-advance stops (WCAG 2.2.2) on pointer, touch, keyboard focus, off-screen, hidden tab or user pause. */
export function isHeld(input: HoldInput): boolean {
  return Object.values(input).some(Boolean);
}
