import {
  buildSummaryRows,
  formatAmount,
  invalidFields,
  normalise,
  parseAmount,
  searchZones,
  stepFields,
  type FieldKey,
  type FormValues,
  type Operation,
  type SearchState,
  type SummaryLabels,
  type ZoneEntry,
  type ZoneIndexEntry,
} from "@/features/leads/domain/searchWizard";

/**
 * "Mi búsqueda" wizard (reference `busco-pasos.js` + `demanda.js` presentation): one step at a time
 * with progress, back/next and per-step validation, the live "ideal home" summary, the zone search
 * and the essential-feature toggles. Without this script the form shows every step. Submission is
 * not touched: the lead form island (`leadForm.client.ts`) still builds and opens the message.
 */

interface Strings {
  readonly summary: SummaryLabels & { readonly empty: string };
  readonly zones: Record<
    | "district"
    | "barrio"
    | "add"
    | "chosen"
    | "none"
    | "addOther"
    | "alt"
    | "altTitle"
    | "remove"
    | "whole",
    string
  >;
  readonly errors: Record<"emailEmpty" | "phoneEmpty" | FieldKey, string>;
}

const ERROR_FOCUS: Record<FieldKey, string> = {
  operation: "operacion",
  price: "precio_max",
  area: "m2_max",
  name: "nombre",
  email: "email",
  phone: "telefono",
  consentData: "c_datos",
  channels: "c_canal",
};

const TAG = "inline-flex items-stretch border border-petrol bg-petrol text-canvas";
const TAG_BTN =
  "cursor-pointer appearance-none border-0 border-l border-canvas/30 bg-transparent px-2.5 text-[0.59375rem] leading-none font-medium tracking-[0.12em] text-inherit transition-colors hover:bg-taupe/35 aria-pressed:bg-taupe aria-pressed:text-dark";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function initWizard(): void {
  const root = document.querySelector<HTMLElement>("[data-wizard]");
  const form = root?.querySelector<HTMLFormElement>("form[data-lead-form]");
  const raw = root?.querySelector("script[data-wizard-strings]")?.textContent;
  if (root === undefined || root === null || !form || !raw || root.dataset["ready"] !== undefined)
    return;
  root.dataset["ready"] = "";
  const strings = JSON.parse(raw) as Strings;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const controller = new AbortController();
  document.addEventListener("astro:before-swap", () => controller.abort(), { once: true });
  /** Timer tied to this page: a pending scroll/focus must never fire on the next page. */
  const later = (callback: () => void, ms: number): void => {
    const id = window.setTimeout(callback, ms);
    controller.signal.addEventListener("abort", () => window.clearTimeout(id), { once: true });
  };

  const $ = <T extends Element>(selector: string, scope: ParentNode = form) =>
    scope.querySelector<T>(selector);
  const $$ = <T extends Element>(selector: string, scope: ParentNode = form) => [
    ...scope.querySelectorAll<T>(selector),
  ];
  const named = (name: string) => $$<HTMLInputElement>(`[name="${name}"]`);
  const control = (name: string) => named(name)[0] ?? null;
  const text = (name: string) => control(name)?.value.trim() ?? "";
  const checked = (name: string) => named(name).filter((input) => input.checked);
  const label = (input: HTMLInputElement) => input.dataset["label"] ?? input.value;

  const steps = $$<HTMLElement>(":scope > fieldset[data-step]");
  const top = $<HTMLElement>("[data-wizard-top]");
  const nav = $<HTMLElement>("[data-wizard-nav]");
  const count = $<HTMLElement>("[data-wizard-count]");
  const titleOut = $<HTMLElement>("[data-wizard-title]");
  const bar = $<HTMLElement>("[role=progressbar]");
  const fill = bar?.querySelector<HTMLElement>("b");
  const prev = $<HTMLButtonElement>("[data-prev]");
  const nextWrap = $<HTMLElement>("[data-next]");
  const next = nextWrap?.querySelector("button");
  const total = steps.length;
  if (!top || !nav || !count || !titleOut || !bar || !fill || !prev || !nextWrap || !next) return;
  if (total === 0) return;
  let current = 0;

  /* ---------- State read from the form ---------- */
  const operation = (): Operation => {
    const value = checked("operacion")[0]?.value;
    return value === "venta" || value === "alquiler" ? value : "";
  };
  const amount = (name: string) => parseAmount(text(name));
  const alternatives = new Set<string>();
  const freeZones = () =>
    text("zona_libre")
      .split(/[,;]+/)
      .map((zone) => zone.trim())
      .filter(Boolean);

  interface Zone extends ZoneEntry {
    readonly key: string;
  }
  function zones(): Zone[] {
    const out: Zone[] = [];
    for (const district of checked("distrito")) {
      const block = $(`[data-when="${district.value}"]`);
      const barrios = block ? $$<HTMLInputElement>("input:checked", block) : [];
      if (barrios.length > 0) {
        for (const barrio of barrios) {
          const key = `b:${barrio.value}`;
          out.push({
            key,
            name: label(barrio),
            wholeDistrict: false,
            alternative: alternatives.has(key),
          });
        }
      } else {
        const key = `d:${district.value}`;
        out.push({
          key,
          name: label(district),
          wholeDistrict: true,
          alternative: alternatives.has(key),
        });
      }
    }
    for (const free of freeZones()) {
      const key = `l:${free.toLowerCase()}`;
      out.push({ key, name: free, wholeDistrict: false, alternative: alternatives.has(key) });
    }
    return out;
  }

  const state = (): SearchState => {
    const term = checked("plazo")[0];
    return {
      operation: operation(),
      types: checked("tipo").map(label),
      zones: zones(),
      openToOthers: checked("abierto")[0]?.dataset["value"] ?? "",
      priceMin: amount("precio_min"),
      priceMax: amount("precio_max"),
      areaMin: amount("m2_min"),
      areaMax: amount("m2_max"),
      rooms: checked("dormitorios_min")[0]?.value ?? "",
      baths: checked("banos_min")[0]?.value ?? "",
      must: checked("caracteristicas")
        .filter((input) => input.dataset["must"] === "1")
        .map((input) => input.dataset["base"] ?? label(input)),
      nice: checked("caracteristicas")
        .filter((input) => input.dataset["must"] !== "1")
        .map(label),
      status: checked("estado").map(label),
      term: term === undefined ? "" : label(term),
    };
  };

  const values = (): FormValues => ({
    operation: operation(),
    priceMin: amount("precio_min"),
    priceMax: amount("precio_max"),
    areaMin: amount("m2_min"),
    areaMax: amount("m2_max"),
    name: text("nombre"),
    email: text("email"),
    phone: text("telefono"),
    consentData: checked("c_datos").length > 0,
    commercial: checked("c_comercial").length > 0,
    channels: checked("c_canal").map((input) => input.value),
  });

  /* ---------- Summary ---------- */
  const summary = $<HTMLElement>("[data-summary-list]", root);
  const empty = $<HTMLElement>("[data-summary-empty]", root);
  function renderSummary(): void {
    if (!summary || !empty) return;
    const rows = buildSummaryRows(state(), strings.summary);
    summary.replaceChildren(
      ...rows.map(([term, value]) => {
        const row = el("div", "border-t border-line py-2.75");
        row.append(
          el(
            "dt",
            "text-[0.59375rem] leading-[1.4] font-semibold tracking-[0.18em] text-taupe-tx",
            term,
          ),
          el("dd", "mt-0.75 text-[0.78125rem] leading-[1.55] font-medium tracking-[0.04em]", value),
        );
        return row;
      }),
    );
    empty.hidden = rows.length > 0;
  }
  const details = $<HTMLDetailsElement>("details", root);
  const big = matchMedia("(min-width: 1000px)");
  if (details) {
    details.open = big.matches;
    $("summary", details)?.addEventListener("click", (event) => {
      if (big.matches) event.preventDefault();
    });
    big.addEventListener("change", () => (details.open = big.matches), {
      signal: controller.signal,
    });
  }
  $<HTMLElement>("[data-wizard-summary]", root)?.removeAttribute("hidden");

  /* ---------- Operation: budget unit and placeholders ---------- */
  function syncOperation(): void {
    const op = operation();
    for (const unit of $$<HTMLElement>("[data-unit]")) {
      unit.dataset["either"] ??= unit.textContent ?? "";
      unit.textContent =
        op === "alquiler"
          ? (unit.dataset["rent"] ?? "")
          : op === "venta"
            ? (unit.dataset["buy"] ?? "")
            : (unit.dataset["either"] ?? "");
    }
    for (const input of $$<HTMLInputElement>("[data-placeholder-rent]")) {
      input.placeholder =
        (op === "alquiler" ? input.dataset["placeholderRent"] : input.dataset["placeholderBuy"]) ??
        "";
    }
  }

  /* ---------- Conditional and exclusive options ---------- */
  function syncOptions(changed: HTMLInputElement | null): void {
    for (const block of $$<HTMLElement>("[data-when]")) {
      if (checked("distrito").some((input) => input.value === block.dataset["when"])) continue;
      for (const input of $$<HTMLInputElement>("input", block)) input.checked = false;
    }
    for (const block of $$<HTMLElement>("[data-when-checked]")) {
      const on = checked(block.dataset["whenChecked"] ?? "").length > 0;
      block.hidden = !on;
      if (!on) for (const input of $$<HTMLInputElement>("input", block)) input.checked = false;
    }
    const exclusive = changed?.closest<HTMLElement>("[data-exclusive]");
    if (changed?.checked === true && exclusive) {
      const key = exclusive.dataset["exclusive"];
      for (const input of $$<HTMLInputElement>("input", exclusive)) {
        if (input !== changed && (changed.value === key || input.value === key))
          input.checked = false;
      }
    }
    for (const feature of $$<HTMLElement>("[data-feature]")) {
      const input = $<HTMLInputElement>("input", feature);
      const button = $<HTMLButtonElement>("[data-must]", feature);
      if (!input || !button) continue;
      input.dataset["base"] ??= input.dataset["label"] ?? input.value;
      if (!input.checked) delete input.dataset["must"];
      const must = input.dataset["must"] === "1";
      button.hidden = !input.checked;
      button.setAttribute("aria-pressed", String(must));
      input.dataset["label"] = must
        ? `${input.dataset["base"]} (${button.textContent?.trim() ?? ""})`
        : input.dataset["base"];
    }
    for (const key of [...alternatives]) {
      if (!zones().some((zone) => zone.key === key)) alternatives.delete(key);
    }
  }

  /* ---------- Chosen zones (tags) ---------- */
  const tags = $<HTMLElement>("[data-zone-tags]");
  function renderTags(): void {
    if (!tags) return;
    const list = zones();
    tags.hidden = list.length === 0;
    tags.replaceChildren(
      ...list.map((zone) => {
        const tag = el(
          "span",
          `${TAG}${zone.alternative ? " !bg-transparent !text-fg border-dashed" : ""}`,
        );
        const name = zone.wholeDistrict
          ? strings.zones.whole.replace("{name}", zone.name)
          : zone.name;
        const alt = el("button", TAG_BTN, strings.zones.alt);
        alt.type = "button";
        alt.title = strings.zones.altTitle;
        alt.setAttribute("aria-pressed", String(zone.alternative));
        alt.dataset["alt"] = zone.key;
        const remove = el("button", `${TAG_BTN} text-base`, "×");
        remove.type = "button";
        remove.setAttribute("aria-label", strings.zones.remove.replace("{name}", zone.name));
        remove.dataset["remove"] = zone.key;
        tag.append(
          el(
            "span",
            "px-3 py-2.5 text-[0.65625rem] leading-[1.3] font-semibold tracking-[0.1em]",
            name,
          ),
          alt,
          remove,
        );
        return tag;
      }),
    );
  }
  const input = (selector: string) => $<HTMLInputElement>(selector);
  function removeZone(key: string): void {
    const [kind, ...rest] = key.split(":");
    const value = rest.join(":");
    if (kind === "l") {
      const zone = control("zona_libre");
      if (zone) {
        zone.value = freeZones()
          .filter((free) => free.toLowerCase() !== value)
          .join(", ");
        zone.dispatchEvent(new Event("input", { bubbles: true }));
      }
      return;
    }
    const target = input(`[name="${kind === "d" ? "distrito" : "barrio"}"][value="${value}"]`);
    if (target) {
      target.checked = false;
      target.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  tags?.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const alt = target?.closest<HTMLElement>("[data-alt]");
    const remove = target?.closest<HTMLElement>("[data-remove]");
    if (alt?.dataset["alt"]) {
      const key = alt.dataset["alt"];
      if (alternatives.has(key)) alternatives.delete(key);
      else alternatives.add(key);
      refresh();
    } else if (remove?.dataset["remove"]) {
      removeZone(remove.dataset["remove"]);
      input("#zone-q")?.focus();
    }
  });

  /* ---------- Zone search (combobox) ---------- */
  const query = input("#zone-q");
  const results = $<HTMLElement>("#zone-res");
  if (query && results) {
    const districts = new Map(named("distrito").map((d) => [d.value, label(d)]));
    const index: (ZoneIndexEntry & { district: string })[] = [
      ...named("distrito").map((d) => ({
        kind: "district" as const,
        value: d.value,
        name: label(d),
        key: normalise(label(d)),
        district: "",
      })),
      ...named("barrio").map((b) => {
        const district =
          districts.get(b.closest<HTMLElement>("[data-when]")?.dataset["when"] ?? "") ?? "";
        return {
          kind: "barrio" as const,
          value: b.value,
          name: label(b),
          key: normalise(`${label(b)} ${district}`),
          district,
        };
      }),
    ];
    interface Option {
      readonly kind: "district" | "barrio" | "free";
      readonly value: string;
      readonly name: string;
      readonly sub: string;
    }
    let options: Option[] = [];
    let active = -1;
    const done = (option: Option) =>
      option.kind === "free"
        ? freeZones().some((zone) => zone.toLowerCase() === option.value.toLowerCase())
        : (input(
            `[name="${option.kind === "district" ? "distrito" : "barrio"}"][value="${option.value}"]`,
          )?.checked ?? false);
    const close = () => {
      results.hidden = true;
      query.setAttribute("aria-expanded", "false");
      query.removeAttribute("aria-activedescendant");
      active = -1;
    };
    const mark = (at: number) => {
      active = at;
      $$<HTMLElement>("[role=option]", results).forEach((option, i) => {
        option.setAttribute("aria-selected", String(i === at));
        if (i === at) {
          query.setAttribute("aria-activedescendant", option.id);
          option.scrollIntoView({ block: "nearest" });
        }
      });
    };
    const paint = () => {
      const value = query.value.trim();
      if (value === "") return close();
      const found = searchZones(index, value);
      options = found.map((zone) => ({
        kind: zone.kind,
        value: zone.value,
        name: zone.name,
        sub:
          zone.kind === "district"
            ? strings.zones.district
            : strings.zones.barrio.replace(
                "{district}",
                index.find((e) => e.value === zone.value)?.district ?? "",
              ),
      }));
      const exact = found.some((zone) => normalise(zone.name) === normalise(value));
      if (value.length >= 2 && !exact) {
        options.push({ kind: "free", value, name: value, sub: strings.zones.addOther });
      }
      results.replaceChildren(
        ...(options.length === 0
          ? [el("p", "px-4.5 py-3.5 text-xs text-muted", strings.zones.none)]
          : options.map((option, i) => {
              const button = el(
                "button",
                "grid w-full cursor-pointer gap-0.5 border-0 border-b border-line bg-transparent px-4.5 py-3 text-left font-[inherit] text-fg last:border-b-0 hover:bg-taupe/20 aria-selected:bg-taupe/20",
              );
              button.type = "button";
              button.id = `zone-o${i}`;
              button.setAttribute("role", "option");
              button.setAttribute("aria-selected", "false");
              button.dataset["i"] = String(i);
              button.append(
                el(
                  "b",
                  "text-[0.78125rem] leading-[1.3] font-semibold tracking-[0.1em]",
                  option.kind === "free"
                    ? strings.zones.add.replace("{name}", option.name)
                    : option.name,
                ),
                el(
                  "small",
                  "text-[0.65625rem] leading-[1.4] tracking-[0.1em] text-muted",
                  `${option.sub}${done(option) ? ` · ${strings.zones.chosen}` : ""}`,
                ),
              );
              return button;
            })),
      );
      results.hidden = false;
      query.setAttribute("aria-expanded", "true");
      mark(options.length > 0 ? 0 : -1);
    };
    const choose = (at: number) => {
      const option = options[at];
      if (!option) return;
      if (option.kind === "free") {
        const zone = control("zona_libre");
        if (zone && !done(option)) {
          zone.value = [...freeZones(), option.value].join(", ");
          zone.dispatchEvent(new Event("input", { bubbles: true }));
        }
      } else {
        const target = input(
          `[name="${option.kind === "district" ? "distrito" : "barrio"}"][value="${option.value}"]`,
        );
        if (option.kind === "barrio" && target) {
          const district = input(
            `[name="distrito"][value="${target.closest<HTMLElement>("[data-when]")?.dataset["when"] ?? ""}"]`,
          );
          if (district && !district.checked) {
            district.checked = true;
            district.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
        if (target && !target.checked) {
          target.checked = true;
          target.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      query.value = "";
      close();
      query.focus();
    };
    query.addEventListener("input", paint);
    query.addEventListener("focus", () => query.value.trim() !== "" && paint());
    query.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (results.hidden) paint();
        else mark(Math.min(options.length - 1, active + 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        mark(Math.max(0, active - 1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (!results.hidden && active >= 0) choose(active);
      } else if (event.key === "Escape" && !results.hidden) {
        event.preventDefault();
        close();
      }
    });
    results.addEventListener("mousedown", (event) => event.preventDefault());
    results.addEventListener("click", (event) => {
      const option =
        event.target instanceof Element ? event.target.closest<HTMLElement>("[data-i]") : null;
      if (option) choose(Number(option.dataset["i"]));
    });
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (
          !results.hidden &&
          !(event.target instanceof Element && event.target.closest("[data-zone-search]"))
        )
          close();
      },
      { signal: controller.signal },
    );
  }

  /* ---------- Essential-feature toggle, numbers, live updates ---------- */
  form.addEventListener("click", (event) => {
    const button =
      event.target instanceof Element ? event.target.closest<HTMLElement>("[data-must]") : null;
    const box = button?.parentElement?.querySelector<HTMLInputElement>("input");
    if (!button || !box) return;
    if (box.dataset["must"] === "1") delete box.dataset["must"];
    else box.dataset["must"] = "1";
    box.dispatchEvent(new Event("change", { bubbles: true }));
  });
  for (const name of ["precio_min", "precio_max", "m2_min", "m2_max"]) {
    control(name)?.addEventListener("blur", (event) => {
      const field = event.target as HTMLInputElement;
      const value = parseAmount(field.value);
      if (value !== null) field.value = formatAmount(value, strings.summary.thousands);
    });
  }
  function refresh(): void {
    renderSummary();
    renderTags();
  }
  form.addEventListener("change", (event) => {
    const target = event.target instanceof HTMLInputElement ? event.target : null;
    if (target?.name === "operacion") syncOperation();
    syncOptions(target);
    refresh();
    clearError(target);
  });
  form.addEventListener("input", (event) => {
    refresh();
    clearError(event.target instanceof HTMLInputElement ? event.target : null);
  });

  /* ---------- Validation ---------- */
  const errorLine = (key: FieldKey) => $<HTMLElement>(`[data-error="${key}"]`);
  function clearError(field: HTMLInputElement | null): void {
    const key = (Object.keys(ERROR_FOCUS) as FieldKey[]).find(
      (k) => field?.name === ERROR_FOCUS[k],
    );
    const related: FieldKey[] =
      field?.name === "precio_min" ? ["price"] : field?.name === "m2_min" ? ["area"] : [];
    for (const k of [...(key ? [key] : []), ...related]) {
      const line = errorLine(k);
      if (line && !line.hidden) report(k, values());
    }
  }
  function message(key: FieldKey): string {
    if (key === "email" && text("email") === "") return strings.errors.emailEmpty;
    if (key === "phone" && text("telefono") === "") return strings.errors.phoneEmpty;
    return strings.errors[key];
  }
  /** Shows or clears the error line of one field; returns whether it is valid. */
  function report(key: FieldKey, v: FormValues): boolean {
    const bad = invalidFields(v, [0, 1, 2, 3, 4]).includes(key);
    const line = errorLine(key);
    if (line) {
      line.textContent = bad ? message(key) : "";
      line.hidden = !bad;
    }
    const target = control(ERROR_FOCUS[key]);
    target?.setAttribute("aria-invalid", String(bad));
    return !bad;
  }
  function failing(stepsToCheck: readonly number[]): FieldKey[] {
    const v = values();
    const bad = invalidFields(v, stepsToCheck);
    for (const key of stepsToCheck.flatMap(stepFields)) report(key, v);
    return bad;
  }
  function stepOf(node: Element | null): number {
    return steps.findIndex((step) => node !== null && step.contains(node));
  }
  function focusField(key: FieldKey): void {
    const target = control(ERROR_FOCUS[key]);
    target?.focus();
  }

  /* ---------- Steps ---------- */
  const header = () => document.querySelector<HTMLElement>("header");
  const small = matchMedia("(max-width: 999px)");
  const toTop = (smooth: boolean): void => {
    const offset = (header()?.offsetHeight ?? 76) + 12;
    const y = () =>
      Math.max(0, Math.round(top.getBoundingClientRect().top + window.scrollY - offset));
    const instant = reduce || (small.matches && !smooth);
    window.scrollTo({ top: y(), left: 0, behavior: instant ? "instant" : "smooth" });
    // The page can move after the jump (collapsing address bar, a step with another height).
    later(
      () => {
        if (Math.abs(window.scrollY - y()) > 6)
          window.scrollTo({ top: y(), left: 0, behavior: "instant" });
      },
      instant ? 150 : 900,
    );
  };
  const titleOf = (i: number) => steps[i]?.querySelector("legend h3")?.textContent?.trim() ?? "";
  const focusHeading = () => {
    const heading = steps[current]?.querySelector<HTMLElement>("legend h3");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  };
  const show = (i: number, focus: boolean): void => {
    current = Math.max(0, Math.min(total - 1, i));
    steps.forEach((step, k) => {
      step.toggleAttribute("data-step-off", k !== current);
      if (k === current && focus && !reduce) {
        step.animate(
          [
            { opacity: 0, transform: "translateY(10px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 500, easing: "cubic-bezier(.22,1,.36,1)" },
        );
      }
    });
    const word = (form.dataset["stepTemplate"] ?? "{n}/{total}")
      .replace("{n}", String(current + 1))
      .replace("{total}", String(total));
    count.textContent = word;
    titleOut.textContent = titleOf(current);
    bar.setAttribute("aria-valuenow", String(current + 1));
    bar.setAttribute("aria-valuetext", `${word}: ${titleOf(current)}`);
    fill.style.width = `${((current + 1) / total) * 100}%`;
    prev.hidden = current === 0;
    nextWrap.hidden = current === total - 1;
    if (focus) {
      focusHeading();
      toTop(false);
    }
  };
  function go(delta: number): void {
    if (delta > 0) {
      const bad = failing([current]);
      const first = bad[0];
      if (first !== undefined) return focusField(first);
    }
    show(current + delta, true);
  }
  next.addEventListener("click", () => go(1));
  prev.addEventListener("click", () => go(-1));
  form.addEventListener("keydown", (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (event.key !== "Enter" || !target) return;
    if (target.id === "zone-q" || target.tagName === "TEXTAREA" || target.tagName === "BUTTON")
      return;
    if ((target as HTMLInputElement).type === "submit") return;
    event.preventDefault();
    if (current < total - 1) go(1);
  });
  // Runs before the lead form island's own submit handler (capture phase on the same target).
  form.addEventListener(
    "submit",
    (event) => {
      if ($<HTMLInputElement>("[data-honeypot]")?.value) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      const bad = failing(steps.map((_, i) => i));
      const first = bad[0];
      if (first === undefined) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const at = stepOf(control(ERROR_FOCUS[first]));
      if (at >= 0 && at !== current) show(at, false);
      focusField(first);
    },
    { capture: true },
  );

  /* ---------- "Start your search" button and #formulario entry ---------- */
  const start = document.querySelector<HTMLAnchorElement>('[data-page-head] a[href="#formulario"]');
  start?.addEventListener("click", (event) => {
    event.preventDefault();
    toTop(true);
    try {
      history.replaceState(null, "", "#formulario");
    } catch {
      /* history can be blocked in sandboxed frames */
    }
    later(focusHeading, reduce ? 0 : 650);
  });
  if (location.hash === "#formulario") later(() => toTop(false), 80);

  top.hidden = false;
  nav.hidden = false;
  syncOperation();
  syncOptions(null);
  refresh();
  show(0, false);
}
