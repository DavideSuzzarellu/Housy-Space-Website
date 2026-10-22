/** A JSON-LD document: plain JSON values only. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue | undefined };

export type JsonLdObject = Readonly<Record<string, JsonValue | undefined>>;

const UNSAFE_IN_SCRIPT: Readonly<Record<string, string>> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

// `Array.isArray` does not narrow readonly arrays.
function isJsonArray(value: JsonValue | undefined): value is readonly JsonValue[] {
  return Array.isArray(value);
}

function compactValue(value: JsonValue | undefined): JsonValue | undefined {
  if (isJsonArray(value)) {
    return value
      .map((item: JsonValue) => compactValue(item))
      .filter((item): item is JsonValue => item !== undefined);
  }
  if (typeof value === "object" && value !== null) return compactJsonLd(value);
  return value;
}

/** Drops `undefined` members recursively so optional fields are simply absent. */
export function compactJsonLd(value: JsonLdObject): JsonLdObject {
  const entries: [string, JsonValue][] = [];
  for (const [key, member] of Object.entries(value)) {
    const compacted = compactValue(member);
    if (compacted !== undefined) entries.push([key, compacted]);
  }
  return Object.fromEntries(entries);
}

/**
 * Serializes JSON for an inline `<script type="application/\u2026json">`: escapes the characters
 * that could end the script element, so CRM text can never inject markup.
 */
export function serializeJsonForScript(data: JsonValue): string {
  return JSON.stringify(data).replace(
    /[<>&\u2028\u2029]/g,
    (char) => UNSAFE_IN_SCRIPT[char] ?? char,
  );
}

export function serializeJsonLd(data: JsonLdObject): string {
  return serializeJsonForScript(data);
}
