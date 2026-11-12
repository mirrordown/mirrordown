// Abbreviation rules shared by the remark and Sätteri plugins: which paragraphs define abbreviations, and how a text value splits around the defined terms.

const DEFINITION = /^\*\[([^[\]]+)\]:\s*(.+)$/;
const REGEX_SPECIAL = /[.*+?^${}()|[\]\\]/g;

/**
 * The `[term, title]` pairs a paragraph's text defines, when every line of it is a `*[term]: title` definition; otherwise `undefined` (the paragraph is ordinary text).
 */
export const parseAbbreviations = (
  text: string
): Array<[string, string]> | undefined => {
  const definitions: Array<[string, string]> = [];
  for (const line of text.split(/\r\n|\r|\n/)) {
    const match = DEFINITION.exec(line);
    if (!match) return undefined;
    definitions.push([match[1] ?? ``, (match[2] ?? ``).trim()]);
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
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(REGEX_SPECIAL, `\\$&`));
  const pattern = new RegExp(
    `(^|${BOUNDARY})(${terms.join(`|`)})(?:$|${BOUNDARY})`,
    `gu`
  );
  return (value) => {
    const parts: AbbreviationPart[] = [];
    let last = 0;
    pattern.lastIndex = 0;
    for (
      let match = pattern.exec(value);
      match;
      match = pattern.exec(value)
    ) {
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
