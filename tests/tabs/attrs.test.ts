import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { tabs } from "../../packages/mdit-tabs/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriTabs } from "../../packages/sat-tabs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(tabs).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkTabs)
        .use(remarkAttrs)
        .use(remarkRehype, { handlers: tabsHastHandlers as never })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(src)
    )
  );

describe("tabs + attrs: class on tab label applies to <label>", () => {
  // "% Tab One {.active}" → <label class="markdown-tabs-label active" ...>
  const input =
    "% Tab One {.active}\n> Content for tab one.\n% Tab Two\n> Content for tab two.";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs-label active"');
    expect(result).toContain('class="markdown-tabs-label"');
    expect(result).not.toContain("{.active}");
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs-label active"');
    expect(result).toContain('class="markdown-tabs-label"');
    expect(result).not.toContain("{.active}");
  });
});

describe("tabs + attrs: id on tab label applies to <label>", () => {
  const input =
    "% Tab One {#first-tab}\n> Content for tab one.\n% Tab Two\n> Content for tab two.";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('id="first-tab"');
    expect(result).toContain('class="markdown-tabs-label"');
    expect(result).not.toContain("{#first-tab}");
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('id="first-tab"');
    expect(result).toContain('class="markdown-tabs-label"');
    expect(result).not.toContain("{#first-tab}");
  });
});

describe("tabs + attrs: standalone attr paragraph after tab group applies to <div>", () => {
  // "{#install-tabs}" after closing → <div id="install-tabs" class="markdown-tabs">
  const input =
    "% npm\n> ```sh\n> npm install\n> ```\n% pnpm\n> ```sh\n> pnpm add\n> ```\n\n{#install-tabs}";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('id="install-tabs"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).not.toContain("<p>{#install-tabs}</p>");
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('id="install-tabs"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).not.toContain("<p>{#install-tabs}</p>");
  });
});

describe("tabs + attrs: class on standalone attr paragraph after tab group applies to <div>", () => {
  const input =
    "% Tab One\n> Content.\n% Tab Two\n> Content.\n\n{.highlighted}";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain("markdown-tabs highlighted");
    expect(result).not.toContain("<p>{.highlighted}</p>");
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain("markdown-tabs highlighted");
    expect(result).not.toContain("<p>{.highlighted}</p>");
  });
});

describe("tabs + attrs: attrs on heading before tab group do not bleed into container", () => {
  const input =
    "## Install {.section}\n\n% Tab One\n> Content.\n% Tab Two\n> Content.";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="section"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).not.toContain("markdown-tabs section");
    expect(result).not.toContain("{.section}");
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="section"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).not.toContain("markdown-tabs section");
    expect(result).not.toContain("{.section}");
  });
});

describe("tabs + attrs: attrs on paragraph after tab group do not apply to container", () => {
  const input =
    "% Tab One\n> Content.\n% Tab Two\n> Content.\n\nRead more. {.note}";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="note"');
    expect(result).not.toContain("markdown-tabs note");
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="note"');
    expect(result).not.toContain("markdown-tabs note");
  });
});

describe("tabs + attrs: multiple tab labels each with attrs", () => {
  const input = "% Tab One {.complete}\n> Body.\n% Tab Two {.active}\n> Body.";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs-label complete"');
    expect(result).toContain('class="markdown-tabs-label active"');
    expect(result).not.toContain("{.complete}");
    expect(result).not.toContain("{.active}");
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs-label complete"');
    expect(result).toContain('class="markdown-tabs-label active"');
    expect(result).not.toContain("{.complete}");
    expect(result).not.toContain("{.active}");
  });
});

describe("tabs + attrs: tabs and attrs coexist without interference", () => {
  const input =
    "Some *text*. {.intro}\n\n% Tab One\n> Content.\n% Tab Two\n> Content.\n\nAnother paragraph. {.outro}";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="intro"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="outro"');
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="intro"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="outro"');
  });
});

// A block on a line of its own in a panel goes on the block it's written after, inside the panel: the panel's `>` makes the tab, and markdown-it reads the panel's body without it. A header lazily continuing the panel's last paragraph doesn't change that.
describe("tabs + attrs: a block on a line of its own in a panel", () => {
  const panel = (html: string) =>
    /<section class="markdown-tabs-panel"[^>]*>(.*?)<\/section>/s.exec(
      html
    )?.[1];
  const cases: [string, string, string][] = [
    [
      "goes on the paragraph",
      "% Demo\n> para\n> {.x}",
      '<p class="x">para</p>'
    ],
    [
      "goes on the paragraph a header continues",
      "% Demo\n> para\n> {.x}\n% Code\n> b",
      '<p class="x">para</p>'
    ],
    [
      "after a list, goes on the list",
      "% Demo\n> - a\n> {.x}\n% Code\n> b",
      '<ul class="x"><li>a</li></ul>'
    ],
    [
      "in a list item, goes on the item",
      "% Demo\n> - a\n>   {.x}\n% Code\n> b",
      '<ul><li class="x">a</li></ul>'
    ],
    [
      "after a blockquote, goes on the blockquote",
      "% Demo\n> > q\n> {.x}\n% Code\n> b",
      '<blockquote class="x"><p>q</p></blockquote>'
    ],
    [
      "in a blockquote, goes on its paragraph",
      "% Demo\n> > q\n> > {.x}",
      '<blockquote><p class="x">q</p></blockquote>'
    ]
  ];

  it.each(cases)("%s (markdown-it)", (_, input, expected) => {
    expect(panel(normalizeHtml(md.render(input)))).toBe(expected);
  });

  it.each(cases)("%s (remark)", (_, input, expected) => {
    expect(panel(remd(input))).toBe(expected);
  });

  // Sätteri reads attribute blocks itself, before plugins run; the plugin places those a header hid.
  it.each(cases)("%s (sätteri)", (_, input, expected) => {
    const html = markdownToHtml(input, {
      features: { attributes: true },
      mdastPlugins: [satteriTabs()]
    }).html;
    expect(panel(normalizeHtml(html))).toBe(expected);
  });
});
