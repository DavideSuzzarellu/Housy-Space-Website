import { describe, expect, it } from "vitest";
import {
  HOVER_DELAY_MS,
  hoverIntent,
  isHeld,
  MIN_SWITCH_GAP_MS,
  panelPosition,
  pointerMoved,
  wrapIndex,
} from "./accordionRail";

describe("wrapIndex", () => {
  it("moves to the next panel", () => {
    expect(wrapIndex(2, 1, 8)).toBe(3);
  });

  it("wraps past the last panel to the first", () => {
    expect(wrapIndex(7, 1, 8)).toBe(0);
  });

  it("wraps before the first panel to the last", () => {
    expect(wrapIndex(0, -1, 8)).toBe(7);
  });
});

describe("panelPosition", () => {
  const positions = (active: number) =>
    Array.from({ length: 9 }, (_, index) => panelPosition(index, active, 9, 3));

  it("opens the active panel in the centre with three on each side", () => {
    expect(positions(0)).toEqual([0, 1, 2, 3, "hr", "hl", -3, -2, -1]);
  });

  it("goes round the circle: after the last one comes the first", () => {
    expect(positions(8)).toEqual([1, 2, 3, "hr", "hl", -3, -2, -1, 0]);
    expect(positions(4)).toEqual(["hl", -3, -2, -1, 0, 1, 2, 3, "hr"]);
  });

  it("hides the rest on the side they would leave from", () => {
    expect(panelPosition(4, 0, 9, 3)).toBe("hr");
    expect(panelPosition(5, 0, 9, 3)).toBe("hl");
  });

  it("shows everyone when the side covers the whole circle", () => {
    expect(Array.from({ length: 4 }, (_, i) => panelPosition(i, 0, 4, 3))).toEqual([0, 1, -2, -1]);
  });
});

describe("pointerMoved", () => {
  it("needs a real movement, not the layout shifting under a still mouse", () => {
    expect(pointerMoved(0, 0)).toBe(false);
    expect(pointerMoved(2, 1)).toBe(false);
    expect(pointerMoved(3, 1)).toBe(true);
    expect(pointerMoved(-2, -2)).toBe(true);
  });
});

describe("hoverIntent", () => {
  const base = {
    pointerMoved: true,
    targetIndex: 4,
    currentIndex: 2,
    pendingIndex: -1,
    now: 10_000,
    lastSwitch: 0,
  };

  it("arms the switch for a neighbour the mouse moved onto", () => {
    expect(hoverIntent(base)).toBe("arm");
    expect(HOVER_DELAY_MS).toBe(130);
  });

  it("clears a pending switch when the mouse is over the open panel or outside", () => {
    expect(hoverIntent({ ...base, targetIndex: 2 })).toBe("clear");
    expect(hoverIntent({ ...base, targetIndex: -1 })).toBe("clear");
  });

  it("ignores a still mouse and the panel that is already pending", () => {
    expect(hoverIntent({ ...base, pointerMoved: false })).toBe("ignore");
    expect(hoverIntent({ ...base, pendingIndex: 4 })).toBe("ignore");
  });

  it("waits 700 ms after the previous switch so changes never chain", () => {
    expect(hoverIntent({ ...base, now: 500, lastSwitch: 0 })).toBe("ignore");
    expect(hoverIntent({ ...base, now: MIN_SWITCH_GAP_MS, lastSwitch: 0 })).toBe("arm");
  });
});

describe("isHeld", () => {
  const free = {
    pointerInside: false,
    touching: false,
    keyboardFocus: false,
    offscreen: false,
    tabHidden: false,
    userPaused: false,
  };

  it("runs only when nothing holds it", () => {
    expect(isHeld(free)).toBe(false);
  });

  it.each([
    "pointerInside",
    "touching",
    "keyboardFocus",
    "offscreen",
    "tabHidden",
    "userPaused",
  ] as const)("is held by %s", (reason) => {
    expect(isHeld({ ...free, [reason]: true })).toBe(true);
  });
});
