import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import type StateCore from "markdown-it/lib/rules_core/state_core.mjs";
import reference from "markdown-it-cjk-breaks";
import { cjkBreakRemoved } from "../../packages/core/src";
import { cjkBreaks } from "../../packages/mdit-cjk-breaks/src";
import { parseCases } from "../utils/index.js";
import { paragraphs } from "./generate.js";

// `markdown-it-cjk-breaks` implements the same rule, and reads "the character before and after" differently on purpose (see the guide): it walks to the nearest text token in each direction and steps over everything between, stopping at an empty one. So the two disagree in exactly three kinds of place, and this test finds every break they decide differently and names its kind:
// - "code span": ours reads the code span's own content, the reference steps over it;
// - "not a character": ours stops at an image, raw HTML or another break, the reference steps over it;
// - "wrapping markup": ours reads through emphasis, the reference stops at the empty text token emphasis leaves beside its markup.
// Anything else is a difference in the rule itself, and fails.
type Kind = `code span` | `not a character` | `wrapping markup`;

const WRAPPERS = /^(?:em|strong|s|link)_(?:open|close)$/;

interface Snapshot {
  type: string;
  content: string;
}

// What each plugin reads next to the break at `index`, and the kind of the difference where they read different things.
const kindOf = (
  tokens: readonly Snapshot[],
  index: number,
  step: -1 | 1
): Kind | undefined => {
  // The reference: the first text token, whatever is between.
  let theirs: Snapshot | undefined;
  for (let i = index + step; i >= 0 && i < tokens.length; i += step) {
    if (tokens[i].type === `text`) {
      theirs = tokens[i];
      break;
    }
  }
  // Ours: the first token that is not wrapping markup or empty text.
  let ours: Snapshot | undefined;
  for (let i = index + step; i >= 0 && i < tokens.length; i += step) {
    const token = tokens[i];
    if (WRAPPERS.test(token.type)) continue;
    if (token.type === `text` && token.content === ``) continue;
    ours = token;
    break;
  }
  if (ours === theirs) return undefined;
  if (ours?.type === `code_inline`) return `code span`;
  if (ours !== undefined && ours.type !== `text`) return `not a character`;
  return `wrapping markup`;
};

// Runs both plugins on the same tokens, each softbreak tagged, and returns every break they decide differently with its kinds.
const compare = (input: string): { input: string; kinds: Set<Kind> }[] => {
  const tag = (state: StateCore): void => {
    let id = 0;
    for (const block of state.tokens) {
      for (const token of block.children ?? []) {
        if (token.type === `softbreak`) token.meta = { id: id++ };
      }
    }
  };
  const ours = new MarkdownIt().use(cjkBreaks);
  ours.core.ruler.before(`cjk_breaks`, `tag_breaks`, tag);
  const theirs = new MarkdownIt().use(reference);
  theirs.core.ruler.before(`cjk_breaks`, `tag_breaks`, tag);
  // The tokens both plugins start from, as they were before either ran.
  const snapshots: Snapshot[][] = [];
  theirs.core.ruler.after(`tag_breaks`, `snapshot`, (state) => {
    for (const block of state.tokens) {
      if (block.type === `inline` && block.children)
        snapshots.push(
          block.children.map(({ type, content }) => ({ type, content }))
        );
    }
  });
  const kept = (tokens: ReturnType<MarkdownIt[`parse`]>): Set<number> => {
    const ids = new Set<number>();
    for (const block of tokens) {
      for (const token of block.children ?? []) {
        const meta: unknown = token.meta;
        if (
          token.type === `softbreak` &&
          typeof meta === `object` &&
          meta !== null &&
          `id` in meta &&
          typeof meta.id === `number`
        )
          ids.add(meta.id);
      }
    }
    return ids;
  };
  const ourKept = kept(ours.parse(input, {}));
  const theirKept = kept(theirs.parse(input, {}));
  const differences: { input: string; kinds: Set<Kind> }[] = [];
  let id = 0;
  for (const tokens of snapshots) {
    for (const [index, token] of tokens.entries()) {
      if (token.type !== `softbreak`) continue;
      if (ourKept.has(id) !== theirKept.has(id)) {
        const kinds = new Set<Kind>();
        for (const step of [-1, 1] as const) {
          const kind = kindOf(tokens, index, step);
          if (kind) kinds.add(kind);
        }
        differences.push({ input, kinds });
      }
      id++;
    }
  }
  return differences;
};

const dir = import.meta.dirname;
const fixtures = readdirSync(join(dir, `fixtures`)).flatMap((file) =>
  parseCases(readFileSync(join(dir, `fixtures`, file), `utf8`)).map(
    ({ input }) => input
  )
);
const generated = paragraphs(4000, 20261125);

describe(`cjk-breaks against markdown-it-cjk-breaks`, () => {
  const tally = (inputs: readonly string[]) => {
    const differences = inputs.flatMap(compare);
    const count = (kind: Kind) =>
      differences.filter(({ kinds }) => kinds.has(kind)).length;
    return {
      differences,
      unexplained: differences.filter(({ kinds }) => kinds.size === 0),
      codeSpan: count(`code span`),
      notACharacter: count(`not a character`),
      wrappingMarkup: count(`wrapping markup`)
    };
  };

  it(`differs on the fixtures only where it reads the neighbours differently`, () => {
    const { unexplained, codeSpan, notACharacter, wrappingMarkup } =
      tally(fixtures);
    expect(unexplained).toStrictEqual([]);
    // Each kind is in the fixtures, so the comparison would see a change to any of them.
    expect(codeSpan).toBeGreaterThan(0);
    expect(notACharacter).toBeGreaterThan(0);
    expect(wrappingMarkup).toBeGreaterThan(0);
  });

  it(`differs on generated paragraphs only where it reads the neighbours differently`, () => {
    const { unexplained, differences } = tally(generated);
    expect(unexplained).toStrictEqual([]);
    expect(differences.length).toBeGreaterThan(0);
  });

  it(`agrees with the reference on every break where both read the same characters`, () => {
    // Removing a break is what most of the generated paragraphs exercise: they must come out the same wherever no code span, emphasis or other break stands next to one.
    const md = new MarkdownIt().use(cjkBreaks);
    const ref = new MarkdownIt().use(reference);
    const plain = generated.filter((input) => !/[*`]/.test(input));
    expect(plain.length).toBeGreaterThan(500);
    for (const input of plain) expect(md.render(input)).toBe(ref.render(input));
  });

  // The reference reads East Asian Width from `get-east-asian-width` (1.7.0 in the lockfile, Unicode 18) and Hangul from a list it wrote out by hand from Unicode 10; ours reads both from the Unicode 18 tables in `cjk.ts`. Each non-ASCII code point (ASCII is narrow in every version, and some of it is markup) is put before a break and an ideograph, one paragraph each, and the reference itself says which breaks go. They agree on every one: no Hangul character added since Unicode 10 is wide. A lockfile update that moves `get-east-asian-width` to another Unicode version shows here as the code points that changed.
  it(`reads every character as the reference does`, { timeout: 60_000 }, () => {
    const characters: string[] = [];
    for (let codePoint = 0x80; codePoint <= 0x10ffff; codePoint++) {
      if (codePoint < 0xd800 || codePoint > 0xdfff)
        characters.push(String.fromCodePoint(codePoint));
    }
    const html = new MarkdownIt()
      .use(reference)
      .render(characters.map((character) => `${character}\n日`).join(`\n\n`));
    const paragraphs = html.split(`</p>\n`).slice(0, -1);
    expect(paragraphs).toHaveLength(characters.length);
    const differ: string[] = [];
    for (const [index, character] of characters.entries()) {
      const theirs = paragraphs[index] === `<p>${character}日`;
      if (theirs !== cjkBreakRemoved(character, `日`))
        differ.push(character.codePointAt(0)!.toString(16));
    }
    expect(differ).toStrictEqual([]);
  });
});
