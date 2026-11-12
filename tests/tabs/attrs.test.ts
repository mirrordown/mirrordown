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

// A block on a line of its own after the tabs, written without the panel's `>`, is the group's, as the attrs plugins of markdown-it and remark place it. Sätteri reads attribute blocks before the plugin runs and puts this one on the panel's blockquote, which recognition dissolves: the block was lost. Once a line that is neither a header nor a `>` line has ended the tabs, the block goes on the block it is written after instead; a blockquote rebuilt there had no position, so remd-attrs put the block on its paragraph.
describe("tabs + attrs: a block on its own line after the tabs", () => {
  const sat = (input: string): string =>
    normalizeHtml(
      markdownToHtml(input, {
        features: { attributes: true },
        mdastPlugins: [satteriTabs()]
      }).html
    );
  // The group's own attributes, and what follows the group.
  const shape = (html: string): [string, string] => [
    /^<div class="[^"]*"/.exec(html)?.[0] ?? "",
    html.slice(html.lastIndexOf("</section></div></div>") + 22)
  ];
  const cases: [string, string, [string, string]][] = [
    [
      "goes on the group",
      "% A\n> a\n{.x}",
      ['<div class="markdown-tabs x"', ""]
    ],
    [
      "goes on the group after its last tab",
      "% A\n> a\n% B\n> b\n{.x}",
      ['<div class="markdown-tabs x"', ""]
    ],
    [
      "goes on a blockquote written after a line that ended the tabs",
      "% A\n> a\ntext\n> q\n{.x}",
      [
        '<div class="markdown-tabs"',
        '<p>text</p><blockquote class="x"><p>q</p></blockquote>'
      ]
    ],
    [
      "goes on the paragraph of a line that ended the tabs",
      "% A\n> a\ntext\n{.x}",
      ['<div class="markdown-tabs"', '<p class="x">text</p>']
    ],
    [
      "goes on the blockquote when the tabs end in a nested tab",
      "% A\n%% B\n> a\ntext\n> q\n{.x}",
      [
        '<div class="markdown-tabs"',
        '<p>text</p><blockquote class="x"><p>q</p></blockquote>'
      ]
    ]
  ];
  it.each(cases)("%s (markdown-it)", (_, input, expected) => {
    expect(shape(normalizeHtml(md.render(input)))).toEqual(expected);
  });
  it.each(cases)("%s (remark)", (_, input, expected) => {
    expect(shape(remd(input))).toEqual(expected);
  });
  it.each(cases)("%s (sätteri)", (_, input, expected) => {
    expect(shape(sat(input))).toEqual(expected);
  });
});

// CommonMark continues a paragraph nested in a panel (in a quote there) with the lines written after it, so Sätteri reads an attribute block that ends those lines off that nested paragraph. Recognition cuts the paragraph at the header among them; the attributes of a body line after the header were lost. They belong to the paragraph's last line.
describe("tabs + attrs: attributes ending lines that continue a paragraph nested in a panel go with the last line", () => {
  const sat = (input: string): string =>
    normalizeHtml(
      markdownToHtml(input, {
        features: { attributes: true },
        mdastPlugins: [satteriTabs()]
      }).html
    );
  const cases: [string, string, string][] = [
    [
      "on the label, when the last line is a header",
      "% A\n> > x\n% B {.y}",
      '<label class="markdown-tabs-label y"'
    ],
    [
      "on the last paragraph of that tab's panel",
      "% A\n> > x\n% B\n> b {.y}",
      '<p class="y">b</p></section>'
    ]
  ];
  it.each(cases)("%s (markdown-it)", (_, input, expected) => {
    expect(normalizeHtml(md.render(input))).toContain(expected);
  });
  it.each(cases)("%s (remark)", (_, input, expected) => {
    expect(remd(input)).toContain(expected);
  });
  it.each(cases)("%s (sätteri)", (_, input, expected) => {
    expect(sat(input)).toContain(expected);
  });
});

// With remarkAttrs registered before remarkTabs, an attribute block is already gone from the text when tabs read it, and that text still starts where the block was written. The line after it was then placed one source line too high, on the panel's `>` line, so a header written under the panel was taken for one written in it and opened a nested group.
describe("tabs + attrs (remark, attrs first): a line after an attribute block is placed on its own source line", () => {
  const attrsFirst = (src: string) =>
    normalizeHtml(
      String(
        unified()
          .use(remarkParse)
          .use(remarkAttrs)
          .use(remarkTabs)
          .use(remarkRehype, { handlers: tabsHastHandlers as never })
          .use(rehypeStringify, { allowDangerousHtml: true })
          .processSync(src)
      )
    );
  const cases: [string, string][] = [
    [
      "a header after an image with attributes is the group's next tab",
      "% A\n> ![a](x.png){.photo}\n% B"
    ],
    [
      "the same after another body line",
      "% A\n> ![a](x.png){.photo}\n> more\n% B\n> b"
    ],
    [
      "a plain line after it ends the group",
      "% A\n> ![a](x.png){.photo}\nplain"
    ]
  ];
  it.each(cases)("%s", (_, input) => {
    expect(attrsFirst(input)).toBe(normalizeHtml(md.render(input)));
  });
});
