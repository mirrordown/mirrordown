import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import type { Root } from "mdast";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { cjkBreaks } from "../../packages/mdit-cjk-breaks/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { remarkTags } from "../../packages/remd-tags/src";
import { remarkCjkBreaks } from "../../packages/remd-cjk-breaks/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { satteriTags } from "../../packages/sat-tags/src";
import { satteriCjkBreaks } from "../../packages/sat-cjk-breaks/src";
import { comparable } from "../utils/hostile.js";
import { markdownIt, remark, satteri } from "./engines.js";

const trimmed =
  (render: (input: string) => string) =>
  (input: string): string =>
    render(input).trimEnd();

// Cases whose HTML differs between the engines for reasons that are not this plugin's, so they stay out of the shared fixtures: each engine's output is pinned on its own, and in each the break does what the rule says.
describe(`cjk-breaks where the engines' HTML differs anyway`, () => {
  // markdown-it keeps a tab before a line ending in its text (as commonmark.js does), and remark and Sätteri drop it (as micromark does), so the character before the break is the tab in one and the ideograph in the others. Without the plugin the HTML already differs by that tab. The rule reads the character next to the break, and does not reach past whitespace the parser kept.
  it(`a tab before the break is the character before it where the parser keeps it`, () => {
    const input = `日本語\t\n日本語`;
    expect(trimmed(markdownIt())(input)).toBe(`<p>日本語\t\n日本語</p>`);
    expect(trimmed(remark())(input)).toBe(`<p>日本語日本語</p>`);
    expect(trimmed(satteri())(input)).toBe(`<p>日本語日本語</p>`);
  });

  // GFM strikethrough is `<s>` in markdown-it and `<del>` in remark and Sätteri; it is transparent in all three.
  it(`strikethrough from GFM is transparent`, () => {
    const input = `~~日本~~\n語`;
    expect(trimmed(markdownIt())(input)).toBe(`<p><s>日本</s>語</p>`);
    expect(trimmed(remark(true))(input)).toBe(`<p><del>日本</del>語</p>`);
    expect(trimmed(satteri(true))(input)).toBe(`<p><del>日本</del>語</p>`);
  });

  // markdown-it reads no footnotes without a plugin; in remark and Sätteri (GFM) a footnote reference is not a character.
  it(`a footnote reference is not a character`, () => {
    const input = `日本[^1]\n語\n\n[^1]: 注`;
    for (const render of [remark(true), satteri(true)])
      expect(render(input)).toContain(`</sup>\n語</p>`);
  });

  // Raw HTML reaches the page only where the engine is told to keep it: markdown-it's `html`, remark-rehype's `allowDangerousHtml`, and Sätteri by default.
  it(`raw inline HTML is not a character`, () => {
    const input = `日本<b>\n語`;
    const md = new MarkdownIt({ html: true }).use(cjkBreaks);
    const processor = unified()
      .use(remarkParse)
      .use(remarkCjkBreaks)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true });
    expect(comparable(md.render(input)).trimEnd()).toBe(`<p>日本<b>\n語</p>`);
    expect(comparable(String(processor.processSync(input)))).toBe(
      `<p>日本<b>\n語</p>`
    );
    expect(trimmed(satteri())(input)).toBe(`<p>日本<b>\n語</p>`);
  });
});

// A plugin of someone else's adds a token or a node this plugin does not know. Whatever it renders, it is not text the rule can read, so the break beside it stays.
describe(`a node or token the plugin does not know is not a character`, () => {
  it(`markdown-it`, () => {
    const md = new MarkdownIt()
      .use((instance) => {
        instance.inline.ruler.before(`text`, `widget`, (state, silent) => {
          if (!state.src.startsWith(`@@`, state.pos)) return false;
          if (!silent) state.push(`widget`, `span`, 0).content = `本`;
          state.pos += 2;
          return true;
        });
        instance.renderer.rules[`widget`] = (): string => `<span>本</span>`;
      })
      .use(cjkBreaks);
    expect(md.render(`日本@@\n語`).trimEnd()).toBe(
      `<p>日本<span>本</span>\n語</p>`
    );
  });

  it(`remark`, () => {
    const widget = () => (tree: Root) => {
      const [paragraph] = tree.children;
      if (paragraph?.type !== `paragraph`) return;
      const [text] = paragraph.children;
      if (text?.type !== `text`) return;
      const [before, after] = text.value.split(`@@`);
      paragraph.children = [
        { type: `text`, value: before ?? `` },
        // A node type mdast does not have, as a plugin's own.
        { type: `widget`, data: { hName: `span` } } as unknown as typeof text,
        { type: `text`, value: after ?? `` }
      ];
    };
    const html = String(
      unified()
        .use(remarkParse)
        .use(widget)
        .use(remarkCjkBreaks)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(`日本@@\n語`)
    );
    expect(html).toBe(`<p>日本<span></span>\n語</p>`);
  });

  // Sätteri's math feature makes an `inlineMath` node, which holds characters but is no code span: the plugin does not read it.
  it(`sätteri`, () => {
    const { html } = markdownToHtml(`日本$本$\n語`, {
      features: { math: true, smartPunctuation: false },
      mdastPlugins: [satteriCjkBreaks()]
    });
    expect(comparable(html)).toContain(`\n語</p>`);
  });
});

describe(`markdown-it with breaks on`, () => {
  // `breaks: true` renders every line break as `<br>`: each is a hard break, which the plugin never touches.
  it(`leaves every line break`, () => {
    const md = new MarkdownIt({ breaks: true }).use(cjkBreaks);
    expect(md.render(`日本\n語`).trimEnd()).toBe(`<p>日本<br>\n語</p>`);
  });
});

// A span scan rebuilds the text after a span, recording which of its characters were escaped, since it has no source position. Removing a break from that text must keep the record, or a plugin that runs later reads `\#tag` as a tag.
describe(`the characters a rebuilt text node had escaped stay escaped`, () => {
  const input = `==a== \\#tag 日\n本`;
  const html = `<p><mark>a</mark> #tag 日本</p>`;

  it(`remark`, () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkMark)
      .use(remarkCjkBreaks)
      .use(remarkTags)
      .use(remarkRehype)
      .use(rehypeStringify);
    expect(String(processor.processSync(input))).toBe(html);
  });

  it(`sätteri`, () => {
    const { html: out } = markdownToHtml(input, {
      features: { gfm: false, smartPunctuation: false },
      mdastPlugins: [satteriMark(), satteriCjkBreaks(), satteriTags()]
    });
    expect(out.trimEnd()).toBe(html);
  });
});
