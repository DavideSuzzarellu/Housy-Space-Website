/**
 * Tiny YAML reader for article frontmatter, so the editorial tooling needs no YAML dependency
 * (the project declares none and Astro's own parser is not public API).
 *
 * Supported subset: block mappings and sequences (scalars or mappings), quoted and plain scalars,
 * `|` / `>` block scalars (with `-` / `+`), `[]`, `{}`, simple flow lists of scalars, comments, and
 * `true`/`false`/`null`/numbers. Dates stay strings (the schema coerces them). Anything else
 * (anchors, tags, multi-line flow collections, tabs) throws, so a file the parser cannot read
 * is reported instead of being misread.
 */

type YamlValue = string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

interface Line {
  indent: number;
  text: string;
  /** Blank or comment-only: ignored by the structure, kept for block scalars. */
  skip: boolean;
  raw: string;
}

const KEY =
  /^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^\s:#"'[\]{}-][^:]*?|-[^\s:][^:]*?)\s*:(?:\s+(.*))?$/;

function tokenize(source: string): Line[] {
  return source.split(/\r?\n/).map((raw) => {
    if (/^ *\t/.test(raw)) throw new Error("miniYaml: tab indentation is not supported");
    const text = raw.trimStart();
    return {
      indent: raw.length - text.length,
      text,
      raw,
      skip: text === "" || text.startsWith("#"),
    };
  });
}

function stripComment(value: string): string {
  return value.replace(/(^|\s)#.*$/, "").trim();
}

function unquote(value: string): string {
  if (value.startsWith('"')) {
    return value
      .slice(1, -1)
      .replace(/\\(["\\/nrt])/g, (_m, c: string) => ({ n: "\n", r: "\r", t: "\t" })[c] ?? c);
  }
  return value.slice(1, -1).replace(/''/g, "'");
}

function scalar(raw: string): YamlValue {
  const value = raw.trim();
  if (/^["']/.test(value)) return unquote(stripQuotedTail(value));
  const plain = stripComment(value);
  if (/^[&*!]\S/.test(plain)) {
    throw new Error(`miniYaml: anchors, aliases and tags are not supported: ${plain}`);
  }
  if (plain === "" || plain === "~" || plain === "null") return null;
  if (plain === "true") return true;
  if (plain === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(plain)) return Number(plain);
  if (plain === "[]") return [];
  if (plain === "{}") return {};
  if (plain.startsWith("[") && plain.endsWith("]")) {
    return plain
      .slice(1, -1)
      .split(",")
      .map((item) => scalar(item))
      .filter((item) => item !== null);
  }
  if (plain.startsWith("{") || plain.startsWith("[")) {
    throw new Error(`miniYaml: unsupported flow collection: ${plain}`);
  }
  return plain;
}

/** `"text" # comment` → `"text"`. */
function stripQuotedTail(value: string): string {
  const quote = value[0] ?? '"';
  let index = 1;
  while (index < value.length) {
    if (quote === '"' && value[index] === "\\") index += 2;
    else if (value[index] === quote) {
      if (quote === "'" && value[index + 1] === "'") index += 2;
      else return value.slice(0, index + 1);
    } else index++;
  }
  return value;
}

function parseLines(lines: Line[]): YamlValue {
  let position = 0;

  const next = (): Line | undefined => {
    while (lines[position]?.skip) position++;
    return lines[position];
  };

  function blockScalar(header: string, parentIndent: number): string {
    const folded = header.startsWith(">");
    const chomp = header.endsWith("-") ? "strip" : header.endsWith("+") ? "keep" : "clip";
    const body: Line[] = [];
    while (position < lines.length) {
      const line = lines[position];
      if (line === undefined) break;
      if (line.text !== "" && line.indent <= parentIndent) break;
      body.push(line);
      position++;
    }
    while (body.length > 0 && body[body.length - 1]?.text === "") body.pop();
    const indent = Math.min(...body.filter((l) => l.text !== "").map((l) => l.indent), Infinity);
    const rows = body.map((l) => l.raw.slice(Number.isFinite(indent) ? indent : 0));
    const text = folded
      ? rows
          .join("\n")
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.replace(/\n/g, " "))
          .join("\n")
      : rows.join("\n");
    return chomp === "strip" ? text : `${text}\n`;
  }

  function value(rest: string, parentIndent: number): YamlValue {
    const header = stripComment(rest);
    if (/^[|>][+-]?$/.test(header)) return blockScalar(header, parentIndent);
    if (header === "") {
      const child = next();
      if (child === undefined) return null;
      const isSeq = child.text === "-" || child.text.startsWith("- ");
      if (child.indent > parentIndent || (isSeq && child.indent === parentIndent)) {
        return isSeq ? sequence(child.indent) : mapping(child.indent);
      }
      return null;
    }
    return scalar(rest);
  }

  function mapping(indent: number): YamlValue {
    const result: Record<string, YamlValue> = {};
    for (;;) {
      const line = next();
      if (line === undefined || line.indent !== indent || line.text.startsWith("- ")) break;
      const match = KEY.exec(line.text);
      if (match?.[1] === undefined) throw new Error(`miniYaml: cannot read line: ${line.text}`);
      const key = /^["']/.test(match[1]) ? unquote(match[1]) : match[1];
      position++;
      result[key] = value(match[2] ?? "", indent);
    }
    return result;
  }

  function sequence(indent: number): YamlValue {
    const result: YamlValue[] = [];
    for (;;) {
      const line = next();
      if (line === undefined || line.indent !== indent) break;
      if (line.text !== "-" && !line.text.startsWith("- ")) break;
      const rest = line.text.slice(1).trimStart();
      if (rest === "") {
        position++;
        result.push(value("", indent));
      } else if (KEY.test(rest) && !/^["'[{]/.test(rest)) {
        // `- key: value` opens a mapping whose keys align with the text after the dash.
        const offset = line.text.length - rest.length;
        lines[position] = {
          ...line,
          indent: indent + offset,
          text: rest,
          raw: " ".repeat(indent + offset) + rest,
        };
        result.push(mapping(indent + offset));
      } else {
        position++;
        result.push(scalar(rest));
      }
    }
    return result;
  }

  const first = next();
  if (first === undefined) return null;
  return first.text.startsWith("- ") ? sequence(first.indent) : mapping(first.indent);
}

export function parseMiniYaml(source: string): unknown {
  return parseLines(tokenize(source));
}
