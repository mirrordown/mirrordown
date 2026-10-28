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
  for (const line of text.split(`\n`)) {
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

/**
 * Build the scan for a document's abbreviations. Terms match on word boundaries, longest first; the scan returns the pieces of a text value, or `undefined` when it holds no term.
 */
export const createAbbreviationScan = (
  abbreviations: ReadonlyMap<string, string>
): ((value: string) => AbbreviationPart[] | undefined) => {
  const terms = [...abbreviations.keys()]
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(REGEX_SPECIAL, `\\$&`));
  const pattern = new RegExp(`\\b(${terms.join(`|`)})\\b`, `g`);
  return (value) => {
    const parts: AbbreviationPart[] = [];
    let last = 0;
    for (const match of value.matchAll(pattern)) {
      const term = match[1] ?? ``;
      if (match.index > last)
        parts.push({ text: value.slice(last, match.index) });
      parts.push({ term, title: abbreviations.get(term) ?? `` });
      last = match.index + term.length;
    }
    if (parts.length === 0) return undefined;
    if (last < value.length) parts.push({ text: value.slice(last) });
    return parts;
  };
};
