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

// Every plugin on, as the presets compose them, so captions meet the plugins that render the blocks they caption.
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

// [name, input, what the output must contain]
const cases: [string, string, string[]][] = [
  [
    `attrs: attributes ending the caption go on the figure`,
    `![A lighthouse](lighthouse.jpg)\n~: The lighthouse {#fig-light .wide}`,
    [
      `<figure class="markdown-caption wide" id="fig-light"><img src="lighthouse.jpg" alt="A lighthouse"><figcaption>The lighthouse</figcaption></figure>`
    ]
  ],
  [
    `attrs: a line of attributes after the caption goes on the figure`,
    `![A lighthouse](lighthouse.jpg)\n~: The lighthouse\n{.wide}`,
    [`<figure class="markdown-caption wide">`]
  ],
  [
    `attrs: an image's own attributes stay on it`,
    `![A lighthouse](lighthouse.jpg){.photo}\n~: The lighthouse`,
    [
      `<figure class="markdown-caption"><img src="lighthouse.jpg" alt="A lighthouse" class="photo">`
    ]
  ],
  [
    `attrs: a fence keeps its attributes, the figure takes the caption's`,
    "```js {.numbered}\ncode\n```\n~: Listing {#listing-1}",
    [
      `<figure class="markdown-caption" id="listing-1"><pre><code class="numbered language-js">`
    ]
  ],
  [
    `attrs: a table caption's attributes go on the figure`,
    `| a |\n| - |\n| 1 |\n~: A table {#table-1}`,
    [`<figure class="markdown-caption" id="table-1"><table>`]
  ],
  [
    `tabs: a caption inside a panel captions its block`,
    `% One\n> ![A lighthouse](lighthouse.jpg)\n> ~: In the panel`,
    [
      `<section class="markdown-tabs-panel" aria-label="One"><figure class="markdown-caption"><img`
    ]
  ],
  [
    `tabs: a caption after the group captions the group`,
    `% One\n> First\n% Two\n> Second\n~: The tab group`,
    [
      `<figure class="markdown-caption"><div class="markdown-tabs"`,
      `</div></div><figcaption>The tab group</figcaption></figure>`
    ]
  ],
  [
    `steps: a caption after the steps captions them`,
    `@1. First\n>  Do this.\n@1. Second\n>  Then this.\n~: The procedure`,
    [
      `<figure class="markdown-caption"><ol class="markdown-steps">`,
      `</ol><figcaption>The procedure</figcaption></figure>`
    ]
  ],
  [
    `steps: a caption inside a step body captions its block`,
    "@1. First\n>  ```sh\n>  npm install\n>  ```\n>  ~: The command",
    [
      `<div class="markdown-steps-body"><figure class="markdown-caption"><pre><code class="language-sh">`
    ]
  ],
  [
    `alerts: a caption after an alert captions it`,
    `> [!NOTE]\n> Remember this.\n~: A note`,
    [
      `<figure class="markdown-caption"><div class="markdown-alert" data-alert="note">`,
      `</div><figcaption>A note</figcaption></figure>`
    ]
  ],
  [
    `definition lists: a caption after the list captions it`,
    `Term\n: Definition\n~: A glossary`,
    [
      `<figure class="markdown-caption"><dl><dt>Term</dt><dd>Definition</dd></dl><figcaption>A glossary</figcaption></figure>`
    ]
  ],
  [
    `unwrap-images: a captioned image is the figure's content`,
    `![A lighthouse](lighthouse.jpg)\n~: The lighthouse`,
    [
      `<figure class="markdown-caption"><img src="lighthouse.jpg" alt="A lighthouse"><figcaption>`
    ]
  ],
  [
    `lightbox: a lightbox image keeps its trigger in the figure`,
    `!![A lighthouse](lighthouse.jpg)\n~: The lighthouse`,
    [
      `<figure class="markdown-caption"><button type="button" class="markdown-lightbox-trigger"`,
      `</button><figcaption>The lighthouse</figcaption></figure>`
    ]
  ],
  [
    `mermaid-pele: a diagram's caption`,
    "```mermaid\nflowchart LR\n  A --> B\n```\n~: A diagram",
    [
      `<figure class="markdown-caption"><svg xmlns="http://www.w3.org/2000/svg" class="pele pele-flowchart"`,
      `</svg><figcaption>A diagram</figcaption></figure>`
    ]
  ]
];

describe.each(cases)(`caption + %s`, (_, input, contains) => {
  const [first] = engines.map(({ render }) => render(input));
  it.each(engines)(`$engine`, ({ render }) => {
    const html = render(input);
    expect(html).toBe(first);
    for (const part of contains) expect(html).toContain(part);
  });
});
