// Abbreviation rules shared by the remark and Sätteri plugins: which paragraphs define abbreviations, and how a text value splits around the defined terms.

type Definitions = Array<[term: string, title: string]>;
type Line = [term: string | undefined, title: string | undefined];

// A definition line as the parser left it, in a text node.
const DEFINITION = /^\*\[([^[\]]+)\]:(.+)$/;
// A definition line as written, by the rule markdown-it reads it with: a backslash takes the next character into the term, so the term can hold a bracket.
const SOURCE_DEFINITION = /^\*\[((?:\\.|[^[\]\\])*)\]:(.+)$/;
const ESCAPE = /\\(.)/g;
// What the source of a paragraph holds before the content of a line: indentation and block quote markers.
const LINE_PREFIX = /^[\t >]+/;
const REGEX_SPECIAL = /[.*+?^${}()|[\]\\]/g;

const readLines = (
  lines: string,
  read: (line: string) => Line
): Definitions | undefined => {
  const definitions: Definitions = [];
  for (const line of lines.split(/\r\n|\r|\n/)) {
    const [term, title] = read(line);
    // A line with a blank term or a blank title is not a definition.
    if (!term || !title) return undefined;
    definitions.push([term, title]);
  }
  return definitions;
};

const readText = (line: string): Line => {
  const match = DEFINITION.exec(line);
  return [match?.[1]?.trim(), match?.[2]?.trim()];
};

const readSource = (line: string): Line => {
  const match = SOURCE_DEFINITION.exec(line.replace(LINE_PREFIX, ``));
  return [match?.[1]?.replace(ESCAPE, `$1`).trim(), match?.[2]?.trim()];
};

/**
 * The `[term, title]` pairs a paragraph defines, when every line of it is a `*[term]: title` definition; otherwise `undefined` (the paragraph is ordinary text). `text` is the value of the paragraph's only child, when that is a text node, and `source` is the source the paragraph was parsed from, when its position is known.
 *
 * The source decides where there is one, because that is what markdown-it reads: a title is the rest of the line as written, whatever inline syntax it holds, and a line whose `*` is escaped is not a definition. Without a source (a paragraph another plugin built) the text does.
 */
export const parseAbbreviations = (
  text: string | undefined,
  source?: string
): Definitions | undefined => {
  const parsed = text === undefined ? undefined : readLines(text, readText);
  if (source === undefined) return parsed;
  const definitions = readLines(source, readSource);
  if (!definitions || parsed?.length !== definitions.length) return definitions;
  // The same term as the parser left it. Smart punctuation rewrites the quotes and dashes of the whole document before a plugin runs, so `Int'l` stands in the text as `Int’l`, and markdown-it, which looks for terms before its typographer runs, finds it.
  for (const [index, [term]] of parsed.entries()) {
    const [written, title] = definitions[index] ?? [];
    if (title !== undefined && term !== written)
      definitions.push([term, title]);
  }
  return definitions;
};

/** A piece of text: plain, or a defined term with its title. */
export type AbbreviationPart =
  | { text: string }
  | { term: string; title: string };

// What may stand on either side of a term, besides the edge of the text: Unicode punctuation, a Unicode space, or one of the ASCII symbols and line endings below. This is the set markdown-it-abbr uses, which `@mirrordown/mdit-abbr` keeps, so a term can start or end with any character (`C++`, `.NET`, `日本`), and a letter, digit or other symbol next to a term means it is part of a longer word.
const BOUNDARY = "\\p{P}|\\p{Z}|[ \\r\\n$+<=>^`|~]";

/**
 * Build the scan for a document's abbreviations. A term matches between two boundaries (see `BOUNDARY`), longest first; the scan returns the pieces of a text value, or `undefined` when it holds no term.
 */
export const createAbbreviationScan = (
  abbreviations: ReadonlyMap<string, string>
): ((value: string) => AbbreviationPart[] | undefined) => {
  const terms = [...abbreviations.keys()]
    .filter((term) => term.length > 0)
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(REGEX_SPECIAL, `\\$&`));
  // Without a term the pattern would match the empty string at every boundary.
  if (terms.length === 0) return () => undefined;
  const pattern = new RegExp(
    `(^|${BOUNDARY})(${terms.join(`|`)})(?:$|${BOUNDARY})`,
    `gu`
  );
  return (value) => {
    const parts: AbbreviationPart[] = [];
    let last = 0;
    pattern.lastIndex = 0;
    for (let match = pattern.exec(value); match; match = pattern.exec(value)) {
      const term = match[2] ?? ``;
      const start = match.index + (match[1] ?? ``).length;
      if (start > last) parts.push({ text: value.slice(last, start) });
      parts.push({ term, title: abbreviations.get(term) ?? `` });
      last = start + term.length;
      // The boundary after a term is not consumed: it can be the boundary before the next one. As in markdown-it, the next term needs a boundary character of its own, so a term can't start where the last one ended.
      pattern.lastIndex = last;
    }
    if (parts.length === 0) return undefined;
    if (last < value.length) parts.push({ text: value.slice(last) });
    return parts;
  };
};
