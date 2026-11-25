import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml, type PluginFactoryContext } from "satteri";
import { mirrordown as markdownItPreset } from "../../packages/preset-markdown-it/src";
import { mirrordown as remarkPreset } from "../../packages/preset-remark/src";
import { mirrordown as satteriPreset } from "../../packages/preset-satteri/src";
import { cjkBreaks } from "../../packages/mdit-cjk-breaks/src";
import { remarkCjkBreaks } from "../../packages/remd-cjk-breaks/src";
import { satteriCjkBreaks } from "../../packages/sat-cjk-breaks/src";
import { normalizeHtml } from "../utils/index.js";

// A removed break is a line the plugins after it no longer see, and a span built after it is markup it never read through. markdown-it parses every span and reads every container's lines before any core rule at the end of the chain runs; in remark and Sätteri those sets are mdast plugins like this one, so it has to come after all of them. Each case renders with the preset's own order, and with cjk-breaks moved to just before one set: the first must hold what the author wrote, the second shows what goes wrong.
const options = { githubAlerts: { icons: false } } as const;

const remark = (before?: string): ((input: string) => string) => {
  const preset = remarkPreset(options);
  const name = (plugin: (typeof preset.remarkPlugins)[number]): string =>
    (Array.isArray(plugin) ? plugin[0] : plugin).name;
  const plugins = preset.remarkPlugins.filter(
    (plugin) => before === undefined || name(plugin) !== `remarkCjkBreaks`
  );
  if (before !== undefined)
    plugins.splice(
      plugins.findIndex((plugin) => name(plugin) === before),
      0,
      remarkCjkBreaks
    );
  const processor = unified()
    .use(remarkParse)
    .use(plugins)
    .use(remarkRehype, preset.remarkRehype)
    .use(preset.rehypePlugins)
    .use(rehypeStringify, { allowDangerousHtml: true });
  return (input) => normalizeHtml(String(processor.processSync(input)));
};

const satteri = (before?: string): ((input: string) => string) => {
  const preset = satteriPreset(options);
  // A Sätteri plugin is named by the definition its factory returns.
  const context = {
    source: ``,
    data: {},
    features: {},
    sourceFormat: `markdown`,
    fileURL: undefined
  } satisfies PluginFactoryContext;
  const name = (factory: (typeof preset.mdastPlugins)[number]): string =>
    factory(context).name;
  const plugins = preset.mdastPlugins.filter(
    (factory) => before === undefined || name(factory) !== `cjk-breaks`
  );
  if (before !== undefined)
    plugins.splice(
      plugins.findIndex((factory) => name(factory) === before),
      0,
      satteriCjkBreaks()
    );
  return (input) =>
    normalizeHtml(
      markdownToHtml(input, { ...preset, mdastPlugins: plugins }).html
    );
};

const sets: readonly {
  set: string;
  remark: string;
  satteri?: string;
  input: string;
  right: string;
}[] = [
  // A header line lazily continues the body before it; joined to the next line, it is no longer a header.
  {
    set: `tabs, which find a tab's header by its line`,
    remark: `remarkTabs`,
    satteri: `tabs`,
    input: `% タブ\n> 内容です\n% 二\n> 本文`,
    right: `<section class="markdown-tabs-panel" aria-label="二"><p>本文</p></section>`
  },
  {
    set: `steps, which find a step's header by its line`,
    remark: `remarkSteps`,
    satteri: `steps`,
    input: `@1. 一\n> 本文です\n@2. 二\n> 本文`,
    right: `<p class="markdown-steps-title">二</p><div class="markdown-steps-body"><p>本文</p></div>`
  },
  // The title is the rest of the marker's line.
  {
    set: `alerts, whose title is the marker's line`,
    remark: `remarkGithubAlerts`,
    satteri: `github-alerts`,
    input: `> [!NOTE] タイトル\n> 本文です`,
    right: `<p class="markdown-alert-title" aria-label="タイトル">タイトル</p><p>本文です</p>`
  },
  // A caption is found by its source line, and a table caption's rows are joined by line breaks only once it is built.
  {
    set: `caption, which finds its line in a lazily continued paragraph`,
    remark: `remarkCaption`,
    satteri: `caption`,
    input: `> 引用\n> です\n~: 説明`,
    right: `<figure class="markdown-caption"><blockquote><p>引用です</p></blockquote><figcaption>説明</figcaption></figure>`
  },
  {
    set: `caption, which joins a table caption's rows with line breaks`,
    remark: `remarkCaption`,
    satteri: `caption`,
    input: `| a |\n| - |\n| b |\n~: 説明\n続き`,
    right: `<figcaption>説明続き</figcaption>`
  },
  // A tag ends at the end of its line.
  {
    set: `tags, which end at a line ending`,
    remark: `remarkTags`,
    satteri: `tags`,
    input: `#タグ\n続き`,
    right: `<p><a class="tag" href="#タグ">#タグ</a>続き</p>`
  },
  // A term needs a boundary after it, and a line ending is one.
  {
    set: `abbr, whose terms end at a line ending`,
    remark: `remarkAbbr`,
    satteri: `abbr`,
    input: `*[東大]: 東京大学\n\n東大\nです`,
    right: `<p><abbr title="東京大学">東大</abbr>です</p>`
  },
  // Built after the break was decided, a span is markup the break was not read through: `]]`, `}` and `=` are not wide.
  {
    set: `kbd, whose key it reads through`,
    remark: `remarkKbd`,
    satteri: `kbd`,
    input: `[[日本]]\n語`,
    right: `<p><kbd>日本</kbd>語</p>`
  },
  {
    set: `ruby, whose base text it reads through`,
    remark: `remarkRuby`,
    satteri: `ruby`,
    input: `{日本|にほん}\n語`,
    right: `<p><ruby>日本<rt>にほん</rt></ruby>語</p>`
  },
  {
    set: `mark, whose highlight it reads through`,
    remark: `remarkMark`,
    satteri: `mark`,
    input: `==日本==\n語`,
    right: `<p><mark>日本</mark>語</p>`
  },
  {
    set: `ins, whose insertion it reads through`,
    remark: `remarkIns`,
    satteri: `ins`,
    input: `++日本++\n語`,
    right: `<p><ins>日本</ins>語</p>`
  },
  {
    set: `del, whose deletion it reads through`,
    remark: `remarkDel`,
    satteri: `del`,
    input: `--日本--\n語`,
    right: `<p><del>日本</del>語</p>`
  },
  {
    set: `spoiler, whose content it reads through`,
    remark: `remarkSpoiler`,
    satteri: `spoiler`,
    input: `||日本||\n語`,
    right: `<span class="markdown-spoiler-content">日本</span></label>語</p>`
  },
  // Sätteri reads attribute blocks in its parser, before any plugin.
  {
    set: `attrs, whose block after a span leaves the span next to the break`,
    remark: `remarkAttrs`,
    input: `**日本**{.x}\n語`,
    right: `<p><strong class="x">日本</strong>語</p>`
  },
  {
    set: `prompt, whose preview is part of the page only once it is built`,
    remark: `remarkPrompt`,
    satteri: `prompt-preview`,
    input: "```prompt\n日本\n語\n```",
    right: `<p>日本語</p>`
  }
];

describe.each([
  [`remark`, remark, `remark`],
  [`sätteri`, satteri, `satteri`]
] as const)(`%s: cjk-breaks runs after`, (_, render, engine) => {
  const right = render();
  it.each(sets.filter((set) => set[engine] !== undefined))(
    `$set`,
    ({ input, right: html, ...set }) => {
      expect(right(input)).toContain(html);
      expect(render(set[engine])(input)).not.toContain(html);
    }
  );

  // Sets that read lines whose syntax never sits on a removed break: the line a block id or a task's box is on ends in an ASCII character, so either order renders the same.
  it.each([
    {
      set: `block ids`,
      remark: `remarkBlockIds`,
      satteri: `block-ids`,
      input: `前の行\n日本 ^abc`,
      html: `<p id="^abc">前の行日本</p>`
    },
    {
      set: `task lists`,
      remark: `remarkTaskLists`,
      satteri: `task-lists`,
      input: `- [ ] 日本\n  語`,
      html: `<input type="checkbox" disabled> 日本語</li>`
    }
  ])(`$set, in either order`, ({ input, html, ...set }) => {
    expect(right(input)).toContain(html);
    expect(render(set[engine])(input)).toBe(right(input));
  });
});

describe(`markdown-it: cjk-breaks runs after`, () => {
  // Registered before the preset, its rule runs before every rule the preset's plugins put at the end of the core chain.
  const right = new MarkdownIt().use(markdownItPreset, options);
  const first = new MarkdownIt()
    .use(cjkBreaks)
    .use(markdownItPreset, { ...options, cjkBreaks: false });
  const render = (md: MarkdownIt, input: string): string =>
    normalizeHtml(md.render(input));

  it(`caption, which joins a table caption's rows with soft breaks`, () => {
    const input = `| a |\n| - |\n| b |\n~: 説明\n続き`;
    expect(render(right, input)).toContain(`<figcaption>説明続き</figcaption>`);
    expect(render(first, input)).not.toContain(
      `<figcaption>説明続き</figcaption>`
    );
  });

  // Every other rule at the end of the chain reads no line a removed break could join: tab icons read a tab's one-line label.
  it(`tab icons, in either order`, () => {
    const input = `% [!npm] パッケージ\n> 内容\n> です`;
    expect(render(right, input)).toContain(`<p>内容です</p>`);
    expect(render(first, input)).toBe(render(right, input));
  });
});
