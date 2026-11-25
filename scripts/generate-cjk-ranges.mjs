#!/usr/bin/env node
// Generates packages/core/src/cjk-ranges.ts: the code point tables behind packages/core/src/cjk.ts, computed from the Unicode Character Database files of one pinned Unicode version. The CJK-friendly plugins must give the same answer in every engine, on every Node version and in every browser, and `\p{…}` expressions answer with whatever Unicode version the runtime ships; a checked-in table does not. The definitions are those of the CommonMark CJK-friendly Amendments (https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md). Run by hand after raising VERSION; it is not part of the build:
//
//   node scripts/generate-cjk-ranges.mjs
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The version the specification's ranges.md is computed from.
const VERSION = `18.0.0`;

const root = join(dirname(fileURLToPath(import.meta.url)), `..`);
const output = `packages/core/src/cjk-ranges.ts`;
const CODE_POINTS = 0x110000;

const download = async (file) => {
  const url = `https://www.unicode.org/Public/${VERSION}/ucd/${file}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}: HTTP ${response.status}`);
  }
  const text = await response.text();
  // Every file names its version in its header, so a server that answers with another version's file is caught here rather than in the tables.
  if (!text.slice(0, 1000).includes(VERSION)) {
    throw new Error(`${url} does not name Unicode ${VERSION} in its header`);
  }
  return text.split(/\r\n|\r|\n/);
};

const hex = (digits) => Number.parseInt(digits, 16);

// `0041..005A` or `0041`, as the first and last code point.
const range = (field) => {
  const [first, last = first] = field.split(`..`);
  return [hex(first), hex(last)];
};

// A file of `code points ; value` lines, as one value per code point. `# @missing:` lines give the value of every code point the file does not list, so they are applied first.
const enumerated = (lines) => {
  const values = Array.from({ length: CODE_POINTS });
  const missing = lines.flatMap((line) => {
    const match = /^#\s*@missing:\s*(.*)$/.exec(line);
    return match ? [match[1]] : [];
  });
  const listed = lines.map((line) => line.split(`#`)[0].trim());
  for (const line of [...missing, ...listed]) {
    if (line) {
      const [field, value] = line.split(`;`).map((part) => part.trim());
      const [first, last] = range(field);
      values.fill(value, first, last + 1);
    }
  }
  return values;
};

// A file of `code points ; property` lines for binary properties, as whether each code point has `property`.
const binary = (lines, property) => {
  const has = new Uint8Array(CODE_POINTS);
  for (const line of lines) {
    const [field = ``, value] = line
      .split(`#`)[0]
      .split(`;`)
      .map((part) => part.trim());
    if (value === property) {
      const [first, last] = range(field);
      has.fill(1, first, last + 1);
    }
  }
  return has;
};

const [widths, scripts, categories, emoji, variants] = await Promise.all([
  download(`EastAsianWidth.txt`),
  download(`Scripts.txt`),
  download(`extracted/DerivedGeneralCategory.txt`),
  download(`emoji/emoji-data.txt`),
  download(`StandardizedVariants.txt`)
]);
const width = enumerated(widths);
const script = enumerated(scripts);
const category = enumerated(categories);
const emojiPresentation = binary(emoji, `Emoji_Presentation`);

const isWide = (cp) =>
  width[cp] === `W` || width[cp] === `F` || width[cp] === `H`;
const isHangul = (cp) => script[cp] === `Hangul`;
const isCjk = (cp) => (isWide(cp) && !emojiPresentation[cp]) || isHangul(cp);
// CommonMark's Unicode punctuation: general category P or S.
const isPunctuation = (cp) => /^[PS]/.test(category[cp] ?? ``);

// The code points that pass `test`, as sorted, inclusive [first, last] ranges.
const ranges = (test) => {
  const found = [];
  let start = -1;
  for (let cp = 0; cp <= CODE_POINTS; cp++) {
    const inside = cp < CODE_POINTS && test(cp);
    if (inside && start < 0) {
      start = cp;
    }
    if (!inside && start >= 0) {
      found.push([start, cp - 1]);
      start = -1;
    }
  }
  return found;
};

// The specification's CJK ambiguous punctuation sequences: standardized variation sequences whose description has the words "fullwidth form" (not "non-fullwidth form"), whose first character is Unicode punctuation of East Asian Width A.
const ambiguous = variants.flatMap((line) => {
  const [sequence = ``, description = ``] = line
    .split(`#`)[0]
    .split(`;`)
    .map((part) => part.trim());
  const points = sequence.split(/\s+/).filter(Boolean).map(hex);
  const [first = -1, selector = -1] = points;
  return points.length === 2 &&
    /(?:^|\s)fullwidth form\b/.test(description) &&
    isPunctuation(first) &&
    width[first] === `A`
    ? [[first, selector]]
    : [];
});

const point = (cp) => `0x${cp.toString(16)}`;
const table = (pairs) =>
  `[\n${pairs.map(([a, b]) => `  [${point(a)}, ${point(b)}]`).join(`,\n`)}\n]`;

const wide = ranges(isWide);
const hangul = ranges(isHangul);
const cjk = ranges(isCjk);

writeFileSync(
  join(root, output),
  `// Generated by scripts/generate-cjk-ranges.mjs from the Unicode Character Database, version ${VERSION}. Don't edit it by hand: raise the version in the script and rerun it.

/** Code points from \`first\` to \`last\`, both included. Each table below is sorted and its ranges do not touch. */
export type CodePointRange = readonly [first: number, last: number];

/** A character and the variation selector after it. */
export type VariationSequence = readonly [base: number, selector: number];

/** The Unicode version the tables are computed from. */
export const UNICODE_VERSION = \`${VERSION}\`;

/** East Asian Width (UAX #11) W, F or H, from EastAsianWidth.txt. */
export const EAST_ASIAN_WIDE: readonly CodePointRange[] = ${table(wide)};

/** Script (UAX #24) Hangul, from Scripts.txt. */
export const HANGUL: readonly CodePointRange[] = ${table(hangul)};

/** The specification's CJK characters: East Asian Width W, F or H and not Emoji_Presentation (emoji-data.txt), or Hangul. */
export const CJK_CHARACTERS: readonly CodePointRange[] = ${table(cjk)};

/** The specification's CJK ambiguous punctuation sequences, from StandardizedVariants.txt. */
export const CJK_AMBIGUOUS_PUNCTUATION: readonly VariationSequence[] = ${table(ambiguous)};
`
);

// The formatter owns the layout of every checked-in file, generated or not.
const formatted = spawnSync(`vp fmt ${output}`, {
  cwd: root,
  shell: true,
  stdio: `inherit`
});
if (formatted.status !== 0) {
  throw new Error(`vp fmt ${output} failed`);
}

console.log(
  `Unicode ${VERSION}: ${wide.length} wide ranges, ${hangul.length} Hangul ranges, ${cjk.length} CJK ranges, ${ambiguous.length} ambiguous punctuation sequences`
);
