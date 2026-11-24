import {
  HOVER_DELAY_MS,
  hoverIntent,
  isHeld,
  panelPosition,
  pointerMoved,
  wrapIndex,
  type HoldInput,
} from "./accordionRail";

/**
 * Behaviour of the carousel / accordion: auto-advance with pause, hover intent, touch, keyboard
 * and the pause control. Loaded on demand (see AccordionRail.astro), never with the first paint.
 */
export function initAccordion(root: HTMLElement): void {
  const panels = [...root.querySelectorAll<HTMLElement>("[data-panel]")];
  const circular = root.hasAttribute("data-circular");
  const wrap = root.closest<HTMLElement>("[data-rail-wrap]");
  const desktop = matchMedia("(min-width: 769px)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const abort = new AbortController();
  const { signal } = abort;
  document.addEventListener("astro:before-swap", () => abort.abort(), { once: true });

  let current = 0;
  let lastSwitch = 0;
  let hoverTimer = 0;
  let pendingIndex = -1;
  let lastX = -99;
  let lastY = -99;
  const hold: HoldInput = {
    pointerInside: false,
    touching: false,
    keyboardFocus: false,
    offscreen: true,
    tabHidden: false,
    userPaused: false,
  };

  const syncHold = (): void => {
    hold.tabHidden = document.hidden;
    root.toggleAttribute("data-held", isHeld(hold));
  };

  const activate = (index: number, scrollRow: boolean): void => {
    if (index !== current) lastSwitch = Date.now();
    current = index;
    panels.forEach((panel, position) => {
      panel.dataset["active"] = String(position === index);
      if (circular) {
        panel.dataset["pos"] = String(panelPosition(position, index, panels.length, 3));
      }
    });
    syncHold();
    const panel = panels[index];
    // Phones: the row scrolls on its own; never the page.
    if (scrollRow && panel !== undefined && root.scrollWidth > root.clientWidth) {
      root.scrollTo({ left: panel.offsetLeft - root.offsetLeft - 44, behavior: "smooth" });
    }
  };
  const step = (delta: number, scrollRow: boolean): void =>
    activate(wrapIndex(current, delta, panels.length), scrollRow);

  const clearHover = (): void => {
    clearTimeout(hoverTimer);
    hoverTimer = 0;
    pendingIndex = -1;
  };

  // Touch: the first tap opens a closed panel, the second follows its link.
  panels.forEach((panel, index) => {
    panel.addEventListener(
      "click",
      (event) => {
        if (index === current) return;
        event.preventDefault();
        activate(index, true);
      },
      { signal },
    );
  });

  if (circular) {
    // Mouse: over the carousel (or its arrows) time stops; resting on a neighbour opens it.
    wrap?.addEventListener(
      "pointerenter",
      (event) => {
        if (event.pointerType === "touch" || !desktop.matches) return;
        hold.pointerInside = true;
        syncHold();
      },
      { signal },
    );
    wrap?.addEventListener(
      "pointerleave",
      (event) => {
        if (event.pointerType === "touch") return;
        hold.pointerInside = false;
        clearHover();
        syncHold();
      },
      { signal },
    );
    root.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType === "touch" || !desktop.matches) return;
        const moved = pointerMoved(event.clientX - lastX, event.clientY - lastY);
        lastX = event.clientX;
        lastY = event.clientY;
        const over = event.target instanceof Element ? event.target.closest("[data-panel]") : null;
        const targetIndex = over instanceof HTMLElement ? panels.indexOf(over) : -1;
        const intent = hoverIntent({
          pointerMoved: moved,
          targetIndex,
          currentIndex: current,
          pendingIndex,
          now: Date.now(),
          lastSwitch,
        });
        if (intent === "clear") clearHover();
        if (intent !== "arm") return;
        clearHover();
        pendingIndex = targetIndex;
        hoverTimer = window.setTimeout(() => {
          const next = pendingIndex;
          clearHover();
          if (next >= 0) activate(next, false);
        }, HOVER_DELAY_MS);
      },
      { signal, passive: true },
    );
    root.addEventListener("pointerleave", clearHover, { signal });

    // Keyboard: Tab moves between visible panels, Enter opens (or follows), arrows turn the circle.
    root.addEventListener(
      "keydown",
      (event) => {
        const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (delta === 0) return;
        event.preventDefault();
        step(delta, false);
        panels[current]?.querySelector("a")?.focus({ preventScroll: true });
      },
      { signal },
    );

    // Big touch screens: swipe the row.
    let touchX = 0;
    let touchY = 0;
    root.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.touches[0];
        if (touch === undefined) return;
        touchX = touch.clientX;
        touchY = touch.clientY;
        hold.touching = true;
        syncHold();
      },
      { signal, passive: true },
    );
    const endTouch = (): void => {
      hold.touching = false;
      syncHold();
    };
    root.addEventListener("touchcancel", endTouch, { signal });
    root.addEventListener(
      "touchend",
      (event) => {
        endTouch();
        const touch = event.changedTouches[0];
        if (touch === undefined || !desktop.matches) return;
        const dx = touch.clientX - touchX;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(touch.clientY - touchY)) {
          step(dx < 0 ? 1 : -1, false);
        }
      },
      { signal },
    );

    wrap
      ?.querySelector("[data-rail-prev]")
      ?.addEventListener("click", () => step(-1, false), { signal });
    wrap
      ?.querySelector("[data-rail-next]")
      ?.addEventListener("click", () => step(1, false), { signal });

    // Pause / play for everyone (WCAG 2.2.2).
    const toggle = wrap?.querySelector<HTMLButtonElement>("[data-rail-toggle]");
    toggle?.addEventListener(
      "click",
      () => {
        hold.userPaused = !hold.userPaused;
        toggle.setAttribute(
          "aria-label",
          (hold.userPaused ? toggle.dataset["labelPlay"] : toggle.dataset["labelPause"]) ?? "",
        );
        toggle.querySelector("[data-icon=pause]")?.classList.toggle("hidden", hold.userPaused);
        toggle.querySelector("[data-icon=play]")?.classList.toggle("hidden", !hold.userPaused);
        syncHold();
      },
      { signal },
    );
  } else {
    // Photo variant (districts): hovering a panel opens it at once.
    panels.forEach((panel, index) => {
      panel.addEventListener(
        "pointerenter",
        (event) => {
          if (event.pointerType !== "mouse") return;
          hold.pointerInside = true;
          activate(index, false);
        },
        { signal },
      );
      panel.addEventListener(
        "pointerleave",
        () => {
          hold.pointerInside = false;
          syncHold();
        },
        { signal },
      );
      panel.addEventListener(
        "focusin",
        (event) => {
          // Keyboard only: a tap also focuses the link, and would open the panel before its click.
          if (!(event.target instanceof Element) || !event.target.matches(":focus-visible")) return;
          hold.keyboardFocus = true;
          activate(index, true);
        },
        { signal },
      );
      panel.addEventListener(
        "focusout",
        () => {
          hold.keyboardFocus = false;
          syncHold();
        },
        { signal },
      );
    });
  }

  if (circular) {
    // Only keyboard focus stops the carousel; a mouse click does not.
    wrap?.addEventListener(
      "focusin",
      (event) => {
        hold.keyboardFocus =
          event.target instanceof Element && event.target.matches(":focus-visible");
        syncHold();
      },
      { signal },
    );
    wrap?.addEventListener(
      "focusout",
      (event) => {
        if (event.relatedTarget instanceof Node && wrap.contains(event.relatedTarget)) return;
        hold.keyboardFocus = false;
        syncHold();
      },
      { signal },
    );
  }

  // The end of the progress bar advances to the next panel (not with reduced motion).
  if (!reduced) {
    root.addEventListener("animationend", () => step(1, true), { signal });
  }
  document.addEventListener("visibilitychange", syncHold, { signal });
  const observer = new IntersectionObserver(
    (entries) => {
      hold.offscreen = !entries.some((entry) => entry.isIntersecting);
      syncHold();
    },
    { threshold: 0.35 },
  );
  observer.observe(root);
  signal.addEventListener("abort", () => {
    observer.disconnect();
    clearHover();
  });
  syncHold();
  // Behaviour is attached: specs (and nothing else) wait on this before interacting.
  root.dataset["ready"] = "true";
}
