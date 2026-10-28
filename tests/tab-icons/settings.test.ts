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

const engines = (options: TabIconsOptions) =>
  [
    {
      engine: `markdown-it`,
      render: (input: string) =>
        new MarkdownIt().use(tabs).use(tabIcons, options).render(input)
    },
    {
      engine: `remark`,
      render: (input: string) =>
        String(
          unified()
            .use(remarkParse)
            .use(remarkTabs)
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
          mdastPlugins: [satteriTabs()],
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
