import { buildLeadMessage, mailtoHref, type LeadEntry } from "@/features/leads/domain/leadMessage";

/**
 * Behaviour of every lead form (`[data-lead-form]`: LeadForm, NewsletterForm). Until the CRM
 * receives forms (ROADMAP I3) the request opens in WhatsApp or the mail client, already written.
 */

function entriesOf(form: HTMLFormElement): LeadEntry[] {
  const entries: LeadEntry[] = [];
  form.querySelectorAll<HTMLElement>("[data-lead-field]").forEach((node) => {
    if (node.closest("[hidden]") !== null) return;
    const label = node.dataset["label"] ?? "";
    const controls = [...node.querySelectorAll<HTMLInputElement>("input, select, textarea")];
    const checkable = controls.filter(
      (control) => control.type === "checkbox" || control.type === "radio",
    );
    const value =
      checkable.length > 0
        ? checkable
            .filter((control) => control.checked)
            .map((control) => control.dataset["label"] ?? control.value)
            .join(", ")
        : (controls[0]?.value ?? "");
    entries.push({ label, value });
  });
  return entries;
}

function syncConditional(form: HTMLFormElement): void {
  const chosen = new Set(
    [...form.querySelectorAll<HTMLInputElement>('input[name="distrito"]:checked')].map(
      (input) => input.value,
    ),
  );
  form.querySelectorAll<HTMLElement>("[data-when]").forEach((node) => {
    node.hidden = !chosen.has(node.dataset["when"] ?? "");
  });
}

document.addEventListener("astro:page-load", () => {
  document.querySelectorAll<HTMLFormElement>("[data-lead-form]").forEach((form) => {
    syncConditional(form);
    form.addEventListener("change", () => syncConditional(form));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const message = buildLeadMessage(form.dataset["intro"], entriesOf(form));
      const target = form.dataset["target"] ?? "";
      const href =
        form.dataset["mode"] === "whatsapp"
          ? `${target}?text=${encodeURIComponent(message)}`
          : mailtoHref(target.replace("mailto:", ""), form.dataset["subject"] ?? "", message);
      window.open(href, "_blank", "noopener");
      const status = form.querySelector<HTMLElement>("[data-lead-status]");
      if (status !== null) {
        status.textContent = form.dataset["sent"] ?? "";
        status.hidden = false;
      }
    });
  });
});
