// Inputs that have broken plugin sets before. The audit of November 2026 found the same few mistakes in set after set: user text used as a `replace` pattern, plain objects keyed by user text, line splitting on `\n` only, and regular expressions that restart on every character of a long run. A set's tests run its syntax through this table in all three engines, so the next set does not repeat them.

/**
 * How much longer a hostile input may take to render with a plugin than without it, in milliseconds. Measure against the same pipeline without the plugin, not against zero: remark itself takes about two seconds on a run of 50,000 `+` or `-`, with no plugin at all. Generous for a slow CI machine: the failures this guards against take seconds to minutes.
 */
export const HOSTILE_TIME_LIMIT = 1000;

const RUN = 20_000;

/** A hostile input for one piece of syntax. */
export interface HostileCase {
  name: string;
  input: string;
}

/**
 * The hostile table for a piece of syntax. `wrap` writes the syntax around a piece of content, as an author would (`(text) => "==" + text + "=="`), and `marker` is the character a long run of which the plugin's scanner has to survive (`"="`).
 *
 * Each case must render without throwing, to the same HTML in every engine (compared through {@link comparable}), and no more than {@link HOSTILE_TIME_LIMIT} slower than the pipeline is without the plugin.
 */
export const hostileCases = (
  wrap: (text: string) => string,
  marker: string
): HostileCase[] => [
  // `$&`, `$1`, `$$` and `` $` `` are patterns in a `replace` replacement string.
  { name: `replacement patterns`, input: wrap(`$& $1 $$ $\` $'`) },
  // Members of every object: a lookup in a plain object finds them.
  { name: `constructor`, input: wrap(`constructor`) },
  { name: `__proto__`, input: wrap(`__proto__`) },
  { name: `toString`, input: wrap(`toString`) },
  { name: `hasOwnProperty`, input: wrap(`hasOwnProperty`) },
  // Line endings other than `\n`.
  {
    name: `CRLF line endings`,
    input: `Before\r\n\r\n${wrap(`text`)}\r\n\r\nAfter`
  },
  { name: `a lone CR`, input: `Before\r\r${wrap(`text`)}\r\rAfter` },
  { name: `CRLF inside the content`, input: wrap(`one\r\ntwo`) },
  // Long runs: a scanner that restarts on each character takes quadratic time.
  { name: `a long run of the marker`, input: marker.repeat(RUN) },
  {
    name: `a long run of the marker, then text`,
    input: `${marker.repeat(RUN)} text`
  },
  {
    name: `a long run of spaces before it`,
    input: `a${` `.repeat(RUN)}${wrap(`text`)}`
  },
  {
    name: `a long run of spaces inside it`,
    input: wrap(`a${` `.repeat(RUN)}b`)
  },
  { name: `long content`, input: wrap(`x`.repeat(RUN)) },
  { name: `many in a row`, input: `${wrap(`a`)} `.repeat(2000) },
  // Unclosed, at the very end of the document.
  { name: `opened and never closed`, input: wrap(`text`).slice(0, -1) },
  { name: `empty content`, input: wrap(``) },
  // Characters that HTML escapes (none of them a tag: raw HTML is the host's to keep or drop), and ones outside the Basic Multilingual Plane.
  { name: `characters HTML escapes`, input: wrap(`a < b & "quoted" > c`) },
  { name: `astral characters`, input: wrap(`𝒳 👨‍👩‍👧 é`) }
];

/**
 * An engine's HTML for a hostile case, in the form to compare across engines: markdown-it turns every line ending in text into `\n`, while remark and Sätteri keep a `\r` as written, and no plugin decides that.
 */
export const comparable = (html: string): string =>
  html.replaceAll(/\r\n?/g, `\n`);
