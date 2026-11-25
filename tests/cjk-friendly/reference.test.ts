import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import markdownItCjkFriendly from "markdown-it-cjk-friendly";
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkCjkFriendlyReference from "remark-cjk-friendly";
import remarkCjkFriendlyGfmStrikethrough from "remark-cjk-friendly-gfm-strikethrough";
import { cjkFriendly } from "../../packages/mdit-cjk-friendly/src";
import { remarkCjkFriendly } from "../../packages/remd-cjk-friendly/src";
import { normalizeHtml } from "../utils/index.js";
import { commonMarkExamples, corpus } from "./cases.js";
import { generate } from "./generate.js";

// Ours against the packages the specification's author maintains, in each engine, on the same inputs: the specification's corpus, every CommonMark example, and generated strings. The reference packages are development dependencies of these tests only.

const inputs = {
  corpus: corpus().map(({ input }) => input),
  commonMark: commonMarkExamples().map(({ markdown }) => markdown),
  generated: generate(4000)
};

describe("cjk-friendly against markdown-it-cjk-friendly", () => {
  const ours = new MarkdownIt().use(cjkFriendly);
  const reference = new MarkdownIt().use(markdownItCjkFriendly);
  const plain = new MarkdownIt();

  // The two read the characters beside a run the same way, so they agree on everything. They read the character before a variation selector differently only after a tab or a line break (the reference tests Zs, this plugin markdown-it's own whitespace), a case the specification leaves open and none of these inputs holds.
  it.each(Object.entries(inputs))(
    "renders the %s as the reference does",
    (_, list) => {
      const differ = list.filter(
        (input) => ours.render(input) !== reference.render(input)
      );
      expect(differ).toStrictEqual([]);
    }
  );

  // Every CommonMark example renders as markdown-it renders it without the plugin: the amendment changes only what has a CJK character beside a run.
  it("leaves every CommonMark example as markdown-it renders it", () => {
    const changed = inputs.commonMark.filter(
      (input) => ours.render(input) !== plain.render(input)
    );
    expect(changed).toStrictEqual([]);
  });
});

describe("cjk-friendly against remark-cjk-friendly", () => {
  const remark = (plugins: PluggableList) => {
    const processor = unified()
      .use(remarkParse)
      .use(plugins)
      .use(remarkRehype)
      .use(rehypeStringify);
    return (input: string): string =>
      normalizeHtml(String(processor.processSync(input)));
  };
  // remark-gfm with its defaults on both sides, single-tilde strikethrough included, as the reference strikethrough package expects; that package comes after remark-gfm, which it needs.
  const ours = remark([remarkGfm, remarkCjkFriendly]);
  const reference = remark([
    remarkGfm,
    remarkCjkFriendlyReference,
    remarkCjkFriendlyGfmStrikethrough
  ]);
  const plain = remark([remarkGfm]);

  // Three ways the reference departs from remark, each of which ours keeps, since a document with no CJK character beside a run must render as it did:
  // 1. It reads a character outside the Basic Multilingual Plane whole, where micromark reads its two code units: `🎉` is punctuation to it and a letter to micromark. Ours renders what the reference renders with each such character taken for a letter.
  // 2. It drops micromark's rule that a `*` run flanks beside `_` and a `_` run beside `*` (micromark's own attention markers), so `a*_b_*` changes without any CJK text.
  // 3. Its strikethrough reads the character right before a closing run, not the one a variation selector belongs to, so `~︀~*` cannot close; the specification and markdown-it-cjk-friendly read through the selector.
  const ASTRAL_PUNCTUATION = /^[\p{P}\p{S}]$/u;
  const isAstralPunctuation = (character: string): boolean =>
    character.codePointAt(0)! > 0xffff && ASTRAL_PUNCTUATION.test(character);
  const asLetters = (input: string): string =>
    Array.from(input, (c) => (isAstralPunctuation(c) ? `ß` : c)).join(``);
  const explain = (input: string, html: string): string | undefined => {
    if (
      Array.from(input).some(isAstralPunctuation) &&
      reference(asLetters(input)) === asLetters(html)
    ) {
      return `astral`;
    }
    if (/\*_|_\*/u.test(input)) return `attention markers`;
    if (/[︀-︎]~/u.test(input)) return `strikethrough selector`;
    return undefined;
  };
  const differences = (list: readonly string[]) =>
    list
      .map((input) => ({ input, html: ours(input) }))
      .filter(({ input, html }) => html !== reference(input))
      .map(({ input, html }) => ({ input, why: explain(input, html) }));

  it("renders the corpus as the reference does, but for astral punctuation", () => {
    expect(differences(inputs.corpus)).toStrictEqual([
      { input: `a**a𝜵**a`, why: `astral` },
      { input: `a**𝜵a**a`, why: `astral` },
      { input: `a**𐬻a**a`, why: `astral` },
      { input: `a**a𐬻**a`, why: `astral` }
    ]);
  });

  it("renders every CommonMark example as the reference does, and as remark does without it", () => {
    expect(differences(inputs.commonMark)).toStrictEqual([]);
    expect(
      inputs.commonMark.filter((input) => ours(input) !== plain(input))
    ).toStrictEqual([]);
  });

  it("differs from the reference on generated strings only in the three known ways", () => {
    const found = differences(inputs.generated);
    expect(found.filter(({ why }) => why === undefined)).toStrictEqual([]);
    // Most strings hold none of the three, and those agree.
    expect(found.length).toBeLessThan(inputs.generated.length / 20);
  });

  // The second departure, alone: no CJK text, and the reference changes what remark renders.
  it("keeps micromark's attention markers, which the reference drops", () => {
    expect(ours(`a*_b_*`)).toBe(plain(`a*_b_*`));
    expect(reference(`a*_b_*`)).not.toBe(plain(`a*_b_*`));
  });
});
