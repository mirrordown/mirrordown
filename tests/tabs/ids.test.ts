// The ids a tab group renders with: its group id (a hash of its labels' plain text) and its block id (the group id with the group's place among the document's groups). They must be the same in every engine, or a page hydrated, styled or tested against one engine's output breaks under another.
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { tabs } from "../../packages/mdit-tabs/src";
import { prompt } from "../../packages/mdit-prompt/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { satteriTabs } from "../../packages/sat-tabs/src";

const md = new MarkdownIt().use(tabs);
const remark = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkTabs)
  .use(remarkRehype, { handlers: tabsHastHandlers as never })
  .use(rehypeStringify);

const mdit = (input: string): string => md.render(input);
const remd = (input: string): string => String(remark.processSync(input));
const sat = (input: string): string =>
  markdownToHtml(input, {
    features: { gfm: true, frontmatter: false, smartPunctuation: false },
    mdastPlugins: [satteriTabs()]
  }).html;

const engines = [
  { engine: `markdown-it`, render: mdit },
  { engine: `remark`, render: remd },
  { engine: `sätteri`, render: sat }
];

/** The block id of the group whose first label is `label`: the `name` its radio inputs share. */
const blockIdOf = (html: string, label: string): string | undefined =>
  new RegExp(
    `name="(tabs-[0-9a-f]+)" id="tabs-[0-9a-f]+-0" hidden checked>\\s*<label [^>]*>${label}<`
  ).exec(html)?.[1];

// A group's index is its place in the document, not the order an engine happens to reach it in. remark renders footnote definitions after everything else, so a group written in one used to be counted last there and first in Sätteri.
describe(`tabs ids: groups are numbered in document order`, () => {
  const input = `Text[^1]\n\n[^1]: Note\n\n    % A\n    > a\n\n% B\n> b`;

  it.each([
    { engine: `remark`, render: remd },
    { engine: `sätteri`, render: sat }
  ])(
    `$engine: a group in a footnote definition is counted where it is written`,
    ({ render }) => {
      const html = render(input);
      expect(blockIdOf(html, `A`)).toBe(`tabs-fdb5a87f`);
      expect(blockIdOf(html, `B`)).toBe(`tabs-4aafe541`);
    }
  );

  // The prompt plugin parses a prompt's preview after the rest of the document's blocks, into the tokens after its fence. markdown-it used to count groups as they were parsed, so the preview's group came last; remark and Sätteri see the preview in its place.
  it(`markdown-it: a group in a prompt's preview is counted where the prompt is`, () => {
    const html = new MarkdownIt()
      .use(tabs)
      .use(prompt)
      .render("```prompt\n% A\n> a\n```\n\n% B\n> b");
    expect(blockIdOf(html, `A`)).toBe(`tabs-fdb5a87f`);
    expect(blockIdOf(html, `B`)).toBe(`tabs-4aafe541`);
  });

  it(`a nested group is counted after the group around it, in every engine`, () => {
    const input = `% A\n%% Inner\n> x\n\n% B\n> b`;
    const [a, b, c] = engines.map(({ render }) => {
      const html = render(input);
      return [`A`, `Inner`, `B`].map((label) => blockIdOf(html, label));
    });
    expect(a).toEqual(c);
    expect(b).toEqual(c);
    expect(c?.[0]).toBe(`tabs-fdb5a87f`);
    // B is the third group here, not the second.
    expect(c?.[2]).toMatch(/^tabs-/);
    expect(c?.[2]).not.toBe(`tabs-4aafe541`);
  });
});

// markdown-it used to read a label's plain text from a second render of the label alone, which knows nothing of the document: a link through a reference definition stayed bracketed text there, so `aria-label` and both ids differed from the label shown and from the other engines.
describe(`tabs ids: a label's plain text is the text the label shows`, () => {
  it.each(engines)(
    `$engine: a shortcut reference link counts as its text`,
    ({ render }) => {
      const html = render(`% [foo] bar\n> Body.\n\n[foo]: https://example.com`);
      expect(html).toContain(
        `<a href="https://example.com">foo</a> bar</label>`
      );
      expect(html).toContain(`aria-label="foo bar"`);
    }
  );

  it.each(engines)(
    `$engine: a full reference link gives the same ids as its text would`,
    ({ render }) => {
      const html = render(
        `% [text][foo]\n> Body.\n\n[foo]: https://example.com`
      );
      expect(html).toContain(`aria-label="text"`);
      expect(html).toContain(`data-tabs-group="7c9e690a"`);
      expect(html).toContain(`name="tabs-6efd36e7"`);
    }
  );
});

// Ids used to be counted in a WeakMap keyed on the env, and `md.parse` (unlike `md.render`) doesn't supply one.
describe(`tabs ids: markdown-it needs no env`, () => {
  it(`parses a document given no env, as markdown-it itself does`, () => {
    const tokens = md.parse(`% A\n> b`, undefined);
    expect(md.renderer.render(tokens, md.options, {})).toBe(mdit(`% A\n> b`));
  });

  it(`gives a document the same ids whatever was rendered before it with the same env`, () => {
    const env = {};
    const first = md.render(`% A\n> b`, env);
    md.render(`% Other\n> x\n\n% More\n> y`, env);
    expect(md.render(`% A\n> b`, env)).toBe(first);
  });
});
