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
      // The <pre> takes copy-code's id; the fence's own attributes stay on the <code>.
      `<figure class="markdown-caption" id="listing-1"><pre id="code-`,
      `"><code class="numbered language-js">`
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
      `<div class="markdown-steps-body"><figure class="markdown-caption"><pre id="code-`,
      `"><code class="language-sh">`
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
  ],
  // The author's own style is an attribute like any other. markdown-it's rule once dropped any `text-align` style to keep a table cell's alignment off the figure.
  [
    `attrs: a text-align style written on the caption goes on the figure`,
    `![x](a.jpg)\n~: cap {style="text-align:center"}`,
    [
      `<figure class="markdown-caption" style="text-align:center"><img src="a.jpg" alt="x"><figcaption>cap</figcaption></figure>`
    ]
  ],
  // markdown-it's prompt is three kinds of token without nesting (its fence, the preview's blocks, a closing token), not the balanced pair the caption rule takes a block to be: the figure once opened inside the preview and closed outside the prompt.
  [
    `prompt: a caption after a prompt captions the whole prompt`,
    "```prompt\nDo the thing\n```\n~: A prompt",
    [
      `<figure class="markdown-caption"><div class="markdown-prompt">`,
      `</div><figcaption>A prompt</figcaption></figure>`
    ]
  ],
  [
    `prompt: a marker on a prompt's first line has no block before it`,
    "```prompt\n~: inside\n```",
    [`<div class="markdown-prompt-preview"><p>~: inside</p></div>`]
  ],
  [
    `prompt: a caption inside a prompt captions its block in the preview`,
    "```prompt\ntext\n~: cap\n```",
    [
      `<div class="markdown-prompt-preview"><figure class="markdown-caption"><p>text</p><figcaption>cap</figcaption></figure></div>`
    ]
  ],
  // A known limit, pinned so that a change to it is seen: with subscript on, a `~` later on the caption's line pairs with the marker's before captions are read, in every engine (Sätteri's subscript is built in, so the order can't change there). The guide says to escape that `~`.
  [
    `sub: a later ~ on the line pairs with the marker's and the caption is lost`,
    `![x](y.jpg)\n~: H~2~O formula`,
    [`<sub>: H</sub>2~O formula</p>`]
  ],
  [
    `sub: escaping the later ~ keeps the caption`,
    `![x](y.jpg)\n~: H\\~2\\~O formula`,
    [`<figcaption>H~2~O formula</figcaption></figure>`]
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

// The engines write a column's alignment differently (markdown-it and Sätteri as a `style`, remark as `align`), so this reads the figure alone: the caption's own style goes on it, and the column's alignment, which markdown-it's attrs find on the caption's cell, stays with the table.
describe(`caption + attrs: a table caption's own style goes on the figure`, () => {
  it.each(engines)(`$engine`, ({ render }) => {
    const html = render(
      `| a |\n| :-: |\n| 1 |\n~: cap {style="text-align:right"}`
    );
    expect(html).toContain(
      `<figure class="markdown-caption" style="text-align:right"><table>`
    );
    expect(html).toContain(`center`);
  });
});

// mdit-caption reads other plugins' tokens by name and by `meta`, a contract nothing else writes down: the closing tokens of titles, labels and terms (a caption after one stays text), `meta.attrsSource` on a block tokenized from its own source (its tokens' maps index that source, not the page), `meta.githubAlert` on an alert, and a prompt's `prompt_close` naming its fence. A renamed token or a dropped `meta` would make the rule read the wrong lines silently, so the names are pinned here.
describe(`caption + the plugins whose tokens it reads`, () => {
  it(`markdown-it: the tokens the caption rule reads keep their names`, () => {
    const tokens = md.parse(
      "% One\n> text\n\n@1. Step\n>  body\n\n> [!NOTE]-\n> x\n\nTerm\n: Def\n\n```prompt\nx\n```\n",
      {}
    );
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(
      expect.arrayContaining([
        `tab_input`,
        `tab_label_close`,
        `tabs_labels_close`,
        `steps_title_close`,
        `summary_close`,
        `dt_close`,
        `dd_open`,
        `prompt_close`
      ])
    );
    const withMeta = (key: string): string[] =>
      tokens
        .filter((token) => {
          const meta: unknown = token.meta;
          return typeof meta === `object` && meta !== null && key in meta;
        })
        .map((token) => token.type);
    expect(withMeta(`attrsSource`)).toEqual([
      `tab_panel_open`,
      `steps_body_open`
    ]);
    expect(withMeta(`githubAlert`)).toEqual([`details_open`]);
    expect(withMeta(`fence`)).toEqual([`prompt_close`]);
  });
});
