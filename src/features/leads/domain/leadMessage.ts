/**
 * Until the CRM receives forms (ROADMAP I3), a request leaves as a WhatsApp or email message written
 * by the visitor's own device: nothing is stored or sent by this site.
 */
export interface LeadEntry {
  readonly label: string;
  readonly value: string;
}

export function buildLeadMessage(intro: string | undefined, entries: readonly LeadEntry[]): string {
  const lines = entries
    .filter((entry) => entry.value.trim() !== "")
    .map((entry) => `${entry.label}: ${entry.value.trim()}`);
  return [...(intro === undefined ? [] : [intro]), ...lines].join("\n");
}

/** `mailto:` link with subject and body encoded. */
export function mailtoHref(address: string, subject: string, body: string): string {
  const query = new URLSearchParams({ subject, body }).toString().replace(/\+/g, "%20");
  return `mailto:${address}?${query}`;
}
