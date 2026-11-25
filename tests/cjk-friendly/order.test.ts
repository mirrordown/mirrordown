import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { cjkFriendly } from "../../packages/mdit-cjk-friendly/src";
import { remarkCjkFriendly } from "../../packages/remd-cjk-friendly/src";
import { mark } from "../../packages/mdit-mark/src";
import { sub } from "../../packages/mdit-sub/src";
import { remarkDel } from "../../packages/remd-del/src";
import { remarkIns } from "../../packages/remd-ins/src";
import { remarkMark } from "../../packages/remd-mark/src";
import {
  remarkSpoiler,
  spoilerHastHandlers
} from "../../packages/remd-spoiler/src";
import { remarkSub } from "../../packages/remd-sub/src";
import { remarkSup } from "../../packages/remd-sup/src";
import { normalizeHtml } from "../utils/index.js";

// A plugin that works only when listed in the right place fails the user who lists it elsewhere. Each pair here renders the same in both orders.

describe("cjk-friendly with mdit-sub, in either order", () => {
  // Both override `scanDelims`. mdit-sub lets a `*` run flank a `~` (GFM's rule, `a*~b~*`); cjk-friendly lets a run flank beside CJK punctuation. Each asks the other first, so neither loses what the other decided.
  const input = `a*~b~*と**テスト。**テスト`;
  const expected = `<p>a<em><sub>b</sub></em>と<strong>テスト。</strong>テスト</p>`;
  it.each([
    [`cjk-friendly, sub`, new MarkdownIt().use(cjkFriendly).use(sub)],
    [`sub, cjk-friendly`, new MarkdownIt().use(sub).use(cjkFriendly)]
  ])("%s", (_, md) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  // The override is the instance's own: another markdown-it built after it reads runs as CommonMark does.
  it("leaves other instances alone", () => {
    new MarkdownIt().use(cjkFriendly).use(mark);
    expect(new MarkdownIt().use(mark).render(`==強調。==テスト`)).toBe(
      `<p>==強調。==テスト</p>\n`
    );
  });
});

const remark = (plugins: PluggableList) => {
  const processor = unified()
    .use(remarkParse)
    .use(plugins)
    .use(remarkRehype, { handlers: spoilerHastHandlers })
    .use(rehypeStringify);
  return (input: string): string =>
    normalizeHtml(String(processor.processSync(input)));
};

describe("cjk-friendly with remark-gfm, in either order", () => {
  // micromark tries the construct registered last first, so a strikethrough that only replaced GFM's would need to come after remark-gfm. remd-cjk-friendly switches GFM's off by name and runs it itself, so either order works.
  const input = `~~削除。~~テスト and ~~a~~b`;
  const expected = `<p><del>削除。</del>テスト and <del>a</del>b</p>`;
  it.each([
    [`remark-gfm, cjk-friendly`, [remarkGfm, remarkCjkFriendly]],
    [`cjk-friendly, remark-gfm`, [remarkCjkFriendly, remarkGfm]]
  ] as const)("%s", (_, plugins) => {
    expect(remark([...plugins])(input)).toBe(expected);
  });

  // It runs GFM's own tokenizer, so remark-gfm's options still apply.
  it("keeps remark-gfm's single-tilde option", () => {
    expect(
      remark([[remarkGfm, { singleTilde: false }], remarkCjkFriendly])(
        `~a~ ~~削除。~~テスト`
      )
    ).toBe(`<p>~a~ <del>削除。</del>テスト</p>`);
    expect(remark([remarkGfm, remarkCjkFriendly])(`~a~`)).toBe(
      `<p><del>a</del></p>`
    );
  });

  // Without remark-gfm there is no strikethrough to amend, and `~~` stays text.
  it("adds no strikethrough of its own", () => {
    expect(remark([remarkCjkFriendly])(`~~削除。~~テスト`)).toBe(
      `<p>~~削除。~~テスト</p>`
    );
  });
});

describe("cjk-friendly with Mirrordown's remark plugins, in either order", () => {
  // The span plugins read the rule from the processor's data when they run, after every plugin has been attached.
  const spans: PluggableList = [
    remarkDel,
    remarkIns,
    remarkMark,
    remarkSpoiler,
    remarkSub,
    remarkSup
  ];
  const input = `==強調。==テスト --削除。--テスト ++追加。++テスト ||秘密。||です これは~「下付き」~と^「上付き」^です`;
  const before = remark([remarkCjkFriendly, ...spans]);
  const after = remark([...spans, remarkCjkFriendly]);

  it("renders the same listed before or after them", () => {
    expect(after(input)).toBe(before(input));
  });

  it("amends every one of them", () => {
    const html = before(input);
    for (const tag of [
      `<mark>強調。</mark>`,
      `<del>削除。</del>`,
      `<ins>追加。</ins>`,
      `<span class="markdown-spoiler-content">秘密。</span>`,
      `<sub>「下付き」</sub>`,
      `<sup>「上付き」</sup>`
    ]) {
      expect(html).toContain(tag);
    }
  });

  // The flag is the processor's: a processor without the plugin reads runs as CommonMark does.
  it("leaves other processors alone", () => {
    expect(remark(spans)(`==強調。==テスト`)).toBe(`<p>==強調。==テスト</p>`);
  });
});
