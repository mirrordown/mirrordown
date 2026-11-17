import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { tabs } from "../../packages/mdit-tabs/src";
import {
  tabIcons,
  type TabIconsOptions
} from "../../packages/mdit-tab-icons/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { rehypeTabIcons } from "../../packages/remd-tab-icons/src";
import { satteriTabs } from "../../packages/sat-tabs/src";
import { satteriTabIcons } from "../../packages/sat-tab-icons/src";
import { normalizeHtml } from "../utils/index.js";

const engines = (options: TabIconsOptions, tabsOptions = {}) =>
  [
    {
      engine: `markdown-it`,
      render: (input: string) =>
        new MarkdownIt()
          .use(tabs, tabsOptions)
          .use(tabIcons, options)
          .render(input)
    },
    {
      engine: `remark`,
      render: (input: string) =>
        String(
          unified()
            .use(remarkParse)
            .use(remarkTabs, tabsOptions)
            .use(remarkRehype, { handlers: tabsHastHandlers as never })
            .use(rehypeTabIcons, options)
            .use(rehypeStringify, { allowDangerousHtml: true })
            .processSync(input)
        )
    },
    {
      engine: `sätteri`,
      render: (input: string) =>
        markdownToHtml(input, {
          features: { smartPunctuation: false },
          mdastPlugins: [satteriTabs(tabsOptions)],
          hastPlugins: [satteriTabIcons(options)]
        }).html
    }
  ].map(({ engine, render }) => ({
    engine,
    render: (input: string) => normalizeHtml(render(input))
  }));

const icon = (id: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><title>${id}</title></svg>`;
const rendered = (id: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" class="markdown-tab-icon" aria-hidden="true"><title>${id}</title></svg>`;

// [name, options, input, the labels the output must contain]
const cases: [string, TabIconsOptions, string, string[]][] = [
  [
    `your keyword gets your icon`,
    { icons: { cargo: icon(`cargo`) } },
    `% cargo add\n> Body.`,
    [`>${rendered(`cargo`)}cargo add</label>`]
  ],
  [
    `your icon replaces a built-in one with the same key`,
    { icons: { npm: icon(`mine`) } },
    `% npm\n> Body.`,
    [`>${rendered(`mine`)}npm</label>`]
  ],
  // The options promise that your icons are checked before the built-in ones and replace one with the same key; keys are matched without regard to case, so the same has to hold for how they are merged.
  [
    `your keyword comes before a built-in one of the same length`,
    { icons: { cargo: icon(`cargo`) } },
    `% cargo and react
> Body.
% react and cargo
> Body.`,
    [
      `>${rendered(`cargo`)}cargo and react</label>`,
      `>${rendered(`cargo`)}react and cargo</label>`
    ]
  ],
  [
    `your icon replaces a built-in one whatever the case of its key`,
    { icons: { NPM: icon(`mine`) } },
    `% npm
> Body.
% [!npm] Named
> Body.`,
    [`>${rendered(`mine`)}npm</label>`, `>${rendered(`mine`)}Named</label>`]
  ],
  [
    `your extension comes before a built-in one`,
    { icons: { ".vitepress": icon(`vitepress`) } },
    `% .vitepress/config.ts\n> Body.`,
    [`>${rendered(`vitepress`)}.vitepress/config.ts</label>`]
  ],
  [
    `your marker keyword names your icon`,
    { icons: { cargo: icon(`cargo`) } },
    `% [!cargo] Rust\n> Body.`,
    [`>${rendered(`cargo`)}Rust</label>`, `aria-label="Rust"`]
  ],
  [
    `a light and dark pair renders both`,
    { icons: { cargo: { light: icon(`light`), dark: icon(`dark`) } } },
    `% cargo\n> Body.`,
    [
      `>${rendered(`light`).replace(`aria-hidden="true"`, `aria-hidden="true" data-scheme="light"`)}${rendered(`dark`).replace(`aria-hidden="true"`, `aria-hidden="true" data-scheme="dark"`)}cargo</label>`
    ]
  ],
  [
    `builtin: false leaves only your icons`,
    { builtin: false, icons: { cargo: icon(`cargo`) } },
    `% npm\n> Body.\n% cargo\n> Body.`,
    [`>npm</label>`, `>${rendered(`cargo`)}cargo</label>`]
  ],
  [
    `match: false leaves labels without a marker alone`,
    { match: false },
    `% npm\n> Body.\n% [!yarn] Yarn\n> Body.`,
    [`>npm</label>`, `class="markdown-tab-icon"`]
  ]
];

describe.each(cases)(`tab-icons options: %s`, (_, options, input, contains) => {
  const all = engines(options);
  const [first] = all.map(({ render }) => render(input));
  it.each(all)(`$engine`, ({ render }) => {
    const html = render(input);
    expect(html).toBe(first);
    for (const part of contains) expect(html).toContain(part);
  });
});

// tab-icons finds the tabs plugin's groups by their class, so the option has to mean the same in every engine: a group with another class is not a tab group to decorate.
describe(`tab-icons options: containerClass`, () => {
  const input = `% npm
> Body.
% [!yarn] Y
> Body.`;

  describe(`one that isn't the tabs plugin's leaves its groups as they are`, () => {
    const all = engines({ containerClass: `other` });
    const [first] = all.map(({ render }) => render(input));
    it.each(all)(`$engine`, ({ render }) => {
      const html = render(input);
      expect(html).toBe(first);
      expect(html).not.toContain(`markdown-tab-icon`);
      expect(html).toContain(`>[!yarn] Y</label>`);
      expect(html).toContain(`aria-label="[!yarn] Y"`);
    });
  });

  describe(`the tabs plugin's own gets icons`, () => {
    const all = engines(
      { containerClass: `my-tabs` },
      { containerClass: `my-tabs` }
    );
    const [first] = all.map(({ render }) => render(input));
    it.each(all)(`$engine`, ({ render }) => {
      const html = render(input);
      expect(html).toBe(first);
      expect(html.split(`class="markdown-tab-icon"`)).toHaveLength(3);
      expect(html).toContain(`aria-label="Y"`);
    });
  });
});

// The guide says to install the markdown-it plugin after the tabs plugin. Both are core rules that run in install order, and nothing enforces it, so this pins what each order does. After tabs, tab-icons reads the label's plain text, as the other engines do, and tabs has already named the group from the label as written. Before tabs, it reads the label's source, and tabs then names the group from the label without its marker: the same labels, but not the ids the other engines give.
describe(`tab-icons (markdown-it): install order relative to tabs`, () => {
  const after = new MarkdownIt().use(tabs).use(tabIcons);
  const before = new MarkdownIt().use(tabIcons).use(tabs);
  const withoutIds = (html: string): string =>
    html.replace(/ (?:data-tabs-group|name|id|for)="[^"]*"/g, ``);

  it(`before tabs gives the same labels and panels, under other ids when a marker came out`, () => {
    const input = `% [!none] Next steps
> Body.
% npm
> Body.
% [!yarn] npm install
> Body.
% [!npm] **Install**
> Body.`;
    const html = after.render(input);
    expect(html.split(`class="markdown-tab-icon"`)).toHaveLength(4);
    expect(html).toContain(`aria-label="npm install"`);
    expect(withoutIds(before.render(input))).toBe(withoutIds(html));
    expect(before.render(input)).not.toBe(html);
  });

  it(`before tabs gives the same ids when no marker came out`, () => {
    const input = `% npm
> Body.
% Next steps
> Body.`;
    expect(before.render(input)).toBe(after.render(input));
  });

  it(`only after tabs is a marker written with a character reference read from the label's text`, () => {
    const input = `% &#91;!none] Next steps
> Body.`;
    expect(after.render(input)).toContain(`aria-label="Next steps"`);
    expect(before.render(input)).toContain(`aria-label="[!none] Next steps"`);
  });
});
