/**
 * Static artwork of the sale page, extracted from the reference (decorative, `aria-hidden`):
 * the four illustrative charts of the management report, the two exclusivity schemes and the
 * check mark of the benefits list. Rendered with `set:html`; styled in the sale components.
 */
export const REPORT_CHARTS: readonly string[] = [
  '<svg class="cv41-ch" viewBox="0 0 200 44" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="g" d="M0 43.5h200"/><path class="l" pathLength="1" d="M2 36 26 30 50 33 74 22 98 26 122 14 146 18 170 8 198 11"/><path class="l2" d="M2 40 26 38 50 39 74 34 98 35 122 30 146 31 170 26 198 27"/></svg>',
  '<svg class="cv41-ch" viewBox="0 0 200 44" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="b" d="M0 2h176v5H0zM0 11h140v5H0zM0 20h96v5H0zM0 29h52v5H0z"/><path class="a" d="M0 38h22v5H0z"/></svg>',
  '<svg class="cv41-ch" viewBox="0 0 200 44" aria-hidden="true" focusable="false"><path class="a" d="M0 5h9M4.5 .5v9"/><path class="t" d="M18 5h70M18 14h52M18 23h62"/><path class="m" d="M108 5h9"/><path class="t2" d="M126 5h66M126 14h44"/></svg>',
  '<svg class="cv41-ch" viewBox="0 0 200 44" aria-hidden="true" focusable="false"><path class="g" d="M0 30h200M0 26v8M200 26v8"/><circle class="o" cx="22" cy="30" r="4.5"/><circle class="o" cx="58" cy="30" r="4.5"/><circle class="o" cx="84" cy="30" r="4.5"/><circle class="o" cx="146" cy="30" r="4.5"/><circle class="o" cx="176" cy="30" r="4.5"/><path class="a" d="M112 22.5l7.5 7.5-7.5 7.5-7.5-7.5z"/><path class="t" d="M112 6v12"/></svg>',
];

export const EXCLUSIVITY_SCHEMES: readonly [string, string] = [
  '<svg viewBox="0 0 220 150" aria-hidden="true" focusable="false"><path class="ln" d="M30 26 96 66M30 124 96 84M30 75H94M126 66l64-40M126 84l64 40M126 75h64"/><path class="hs" d="M94 75l16-14 16 14v18h-32z"/><circle class="ag" cx="24" cy="24" r="9"/><circle class="ag" cx="24" cy="75" r="9"/><circle class="ag" cx="24" cy="126" r="9"/><circle class="by" cx="196" cy="24" r="7"/><circle class="by" cx="196" cy="75" r="7"/><circle class="by" cx="196" cy="126" r="7"/></svg>',
  '<svg viewBox="0 0 220 150" aria-hidden="true" focusable="false"><path class="ln" pathLength="1" d="M34 75H196"/><path class="hs" d="M94 75l16-14 16 14v18h-32z"/><circle class="ag" cx="24" cy="75" r="11"/><circle class="by" cx="196" cy="75" r="8"/></svg>',
];

export const CHECK_ICON =
  '<svg viewBox="0 0 26 26" aria-hidden="true" focusable="false"><path pathLength="1" d="M13 2.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21z"/><path pathLength="1" d="M8 13.4l3.4 3.4L18.4 9.6"/></svg>';
