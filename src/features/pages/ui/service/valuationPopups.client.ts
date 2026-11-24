/**
 * Pop-ups of the valuation options. The online option opens the valuator in a dialog (its iframe
 * is created on the first open, so nothing is loaded from the provider before); the adviser option
 * opens the request form. Without JavaScript, or with Ctrl/Cmd/middle click, the links work as
 * plain links (valuation page, contact page).
 */
function plainClick(event: MouseEvent): boolean {
  return !(
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function bindDialog(dialog: HTMLDialogElement): void {
  dialog.addEventListener("click", (event) => {
    // A click on the backdrop lands on the dialog itself; the close button carries the marker.
    if (
      event.target === dialog ||
      (event.target instanceof Element && event.target.closest("[data-dialog-close]") !== null)
    ) {
      dialog.close();
    }
  });
}

function openValuator(dialog: HTMLDialogElement): void {
  const src = dialog.dataset["src"];
  if (src !== undefined && dialog.querySelector("iframe") === null) {
    const frame = document.createElement("iframe");
    frame.src = src;
    frame.title = dialog.dataset["title"] ?? "";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.className = "absolute inset-0 size-full border-0";
    frame.addEventListener("load", () => {
      const loading = dialog.querySelector<HTMLElement>("[data-valuator-loading]");
      if (loading !== null) loading.hidden = true;
    });
    dialog.append(frame);
  }
  dialog.showModal();
}

function init(): void {
  const valuator = document.querySelector<HTMLDialogElement>("#valuation-online-dialog");
  const adviser = document.querySelector<HTMLDialogElement>("#valuation-adviser-dialog");
  for (const dialog of [valuator, adviser]) if (dialog !== null) bindDialog(dialog);
  const wire = (
    selector: string,
    dialog: HTMLDialogElement | null,
    open: (target: HTMLDialogElement) => void,
  ): void => {
    if (dialog === null) return;
    document.querySelectorAll<HTMLElement>(selector).forEach((link) => {
      link.addEventListener("click", (event) => {
        if (!plainClick(event)) return;
        event.preventDefault();
        open(dialog);
      });
    });
  };
  wire("[data-valuation-online]", valuator, openValuator);
  wire("[data-valuation-adviser]", adviser, (dialog) => dialog.showModal());
}

document.addEventListener("astro:page-load", init);
