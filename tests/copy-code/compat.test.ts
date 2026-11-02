import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { mirrordown as markdownItPreset } from "../../packages/preset-markdown-it/src";
import { mirrordown as remarkPreset } from "../../packages/preset-remark/src";
import { mirrordown as satteriPreset } from "../../packages/preset-satteri/src";
import { normalizeHtml } from "../utils/index.js";
import { options as mermaidPele } from "../mermaid-pele/options.js";

// Every plugin on, as the presets compose them, so copy buttons meet the plugins that hold, replace or decorate code blocks.
const md = new MarkdownIt().use(markdownItPreset, { mermaidPele });
const remark = remarkPreset({ mermaidPele });
const remarkProcessor = unified()
  .use(remarkParse)
  .use(remark.remarkPlugins)
  .use(remarkRehype, remark.remarkRehype)
  .use(remark.rehypePlugins)
  .use(rehypeStringify, { allowDangerousHtml: true });
const satteri = satteriPreset({ mermaidPele });

const engines = [
  { engine: `markdown-it`, render: (input: string) => md.render(input) },
  {
    engine: `remark`,
    render: (input: string) => String(remarkProcessor.processSync(input))
  },
  {
    engine: `sätteri`,
    render: (input: string) => markdownToHtml(input, satteri).html
  }
].map(({ engine, render }) => ({
  engine,
  render: (input: string) => normalizeHtml(render(input))
}));

const BUTTON = `<button type="button" class="markdown-copy-code"`;

// [name, input, what the output must contain, what it mustn't]
const cases: [string, string, string[], string[]][] = [
  [
    `attrs: a fence's attributes stay on its <code>, and the <pre> takes the id the button aims at`,
    "```js {.numbered #listing}\ncode\n```",
    [
      `<pre id="code-1x54bn8"><code class="numbered language-js" id="listing">`,
      `commandfor="code-1x54bn8"`
    ],
    []
  ],
  [
    `attrs: nocopy still turns the button off beside attributes`,
    "```sh nocopy {.x}\nrm -rf build\n```",
    [`<pre><code class="x language-sh">`],
    [BUTTON]
  ],
  [
    `mermaid-pele: a diagram is no longer a code block, so it gets no button`,
    "```mermaid\nflowchart LR\n  A --> B\n```",
    [`<svg xmlns="http://www.w3.org/2000/svg" class="pele pele-flowchart"`],
    [BUTTON]
  ],
  [
    `tabs: a code block in a panel gets its button in the panel`,
    "% npm\n> ```sh\n> npm test\n> ```",
    [`</code>${BUTTON}`, `</button></pre></section>`],
    []
  ],
  [
    `caption: the button stays with its block, before the caption`,
    "```sh\nnpm test\n```\n~: Running the tests",
    [
      `<figure class="markdown-caption"><pre id="code-`,
      `</button></pre><figcaption>Running the tests</figcaption></figure>`
    ],
    []
  ]
];

describe.each(cases)(`copy-code + %s`, (_, input, contains, absent) => {
  const [first] = engines.map(({ render }) => render(input));
  it.each(engines)(`$engine`, ({ render }) => {
    const html = render(input);
    expect(html).toBe(first);
    for (const part of contains) expect(html).toContain(part);
    for (const part of absent) expect(html).not.toContain(part);
  });
});
