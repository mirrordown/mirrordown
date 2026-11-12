import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { steps } from "../../packages/mdit-steps/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriSteps } from "../../packages/sat-steps/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(steps).use(attrs);

// remarkAttrs runs after remarkSteps so it can visit stepsItem/stepsList nodes
const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkSteps)
        .use(remarkAttrs)
        .use(remarkRehype, { handlers: stepsHastHandlers as never })
        .use(rehypeStringify)
        .processSync(src)
    )
  );

describe("steps + attrs: class on step container via paragraph attrs", () => {
  const input = "@1. Only step\n>  Body here.";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-steps-item"');
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-steps-item"');
  });
});

describe("steps + attrs: attrs on heading before step block", () => {
  const input = "## Setup {.section}\n\n@1. First step\n>  Content.";
  const expected =
    '<h2 class="section">Setup</h2><ol class="markdown-steps"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">First step</p><div class="markdown-steps-body"><p>Content.</p></div></li></ol>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
});

describe("steps + attrs: attrs on paragraph after step block", () => {
  const input = "@1. Only step\n>  Body.\n\nRead more. {.note}";
  const expectedStepClass = 'class="markdown-steps"';
  const expectedParaClass = 'class="note"';

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain(expectedStepClass);
    expect(result).toContain(expectedParaClass);
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain(expectedStepClass);
    expect(result).toContain(expectedParaClass);
  });
});

describe("steps + attrs: attrs on code fence inside step body", () => {
  const input = "@1. Install\n>\n>  ```ts {.example}\n>  const x = 1;\n>  ```";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps-item"');
    expect(result).toContain("<code");
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps-item"');
    expect(result).toContain("<code");
  });
});

describe("steps + attrs: step block and attrs coexist without interference", () => {
  const input =
    "Some *emphasized* text. {.intro}\n\n@1. Step one\n>  Body.\n@1. Step two\n\nAnother paragraph. {.outro}";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="intro"');
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="outro"');
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="intro"');
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="outro"');
  });
});

describe("steps + attrs: attr in step title applies to <li>", () => {
  // "@1. Step one {.complete}" → <li class="markdown-steps-item complete" data-step="1">
  // mdit: stepsItemEnd rule matches steps_item_open(-2) steps_title_open(-1) inline(0)
  // remd: stepsItem visitor applies hProperties to the node; buildListHast merges them
  const input = "@1. Step one {.complete}\n>  Some content.";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps-item complete"');
    expect(result).toContain('data-step="1"');
    expect(result).not.toContain("{.complete}");
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps-item complete"');
    expect(result).toContain('data-step="1"');
    expect(result).not.toContain("{.complete}");
  });
});

describe("steps + attrs: standalone attr paragraph after step list applies to <ol>", () => {
  // "@1. Step one\n> content\n{#instructions}" → <ol id="instructions" class="markdown-steps">
  // mdit: stepsListAttr rule matches steps_list_close(-2) paragraph_open(-1) inline(0)
  // remd: stepsList sibling visitor applies hProperties; buildListHast merges them
  const input = "@1. Step one\n>  Some content.\n\n{#instructions}";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('id="instructions"');
    expect(result).toContain('class="markdown-steps"');
    expect(result).not.toContain("<p>{#instructions}</p>");
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('id="instructions"');
    expect(result).toContain('class="markdown-steps"');
    expect(result).not.toContain("<p>{#instructions}</p>");
  });
});

describe("steps + attrs: multiple step items each with class", () => {
  const input =
    "@1. Done {.complete}\n>  Body.\n@1. In progress {.active}\n>  Body.";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps-item complete"');
    expect(result).toContain('class="markdown-steps-item active"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps-item complete"');
    expect(result).toContain('class="markdown-steps-item active"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });
});

describe("steps + attrs: attrs on standard ordered list adjacent to step block are unaffected", () => {
  // Verify attrs work on real ordered lists alongside steps, with no cross-contamination.
  const input =
    "@1. A step\n>  Step body.\n\n{#step-list}\n\n1. List item one\n2. List item two\n\n{.my-list}";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('id="step-list"');
    expect(result).toContain('class="my-list"');
    expect(result).not.toMatch(/class="markdown-steps my-list"/);
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('id="step-list"');
    expect(result).toContain('class="my-list"');
    expect(result).not.toMatch(/class="markdown-steps my-list"/);
  });
});

// A block on a line of its own in a step's body goes on the block it's written after, inside the body, whose `>` makes the step. A header lazily continuing the body's last paragraph doesn't change that.
describe("steps + attrs: a block on a line of its own in a body", () => {
  const body = (html: string) =>
    /<div class="markdown-steps-body">(.*?)<\/div>/s.exec(html)?.[1];
  const cases: [string, string, string][] = [
    [
      "goes on the paragraph",
      "@1. Step\n>  para\n>  {.x}",
      '<p class="x">para</p>'
    ],
    [
      "goes on the paragraph a header continues",
      "@1. Step\n>  para\n>  {.x}\n@1. Two\n>  b",
      '<p class="x">para</p>'
    ],
    [
      "after a list, goes on the list",
      "@1. Step\n>  - a\n>  {.x}",
      '<ul class="x"><li>a</li></ul>'
    ]
  ];

  it.each(cases)("%s (markdown-it)", (_, input, expected) => {
    expect(body(normalizeHtml(md.render(input)))).toBe(expected);
  });

  it.each(cases)("%s (remark)", (_, input, expected) => {
    expect(body(remd(input))).toBe(expected);
  });

  // Sätteri reads attribute blocks itself, before plugins run; the plugin places those a header hid.
  it.each(cases)("%s (sätteri)", (_, input, expected) => {
    const html = markdownToHtml(input, {
      features: { attributes: true },
      mdastPlugins: [satteriSteps()]
    }).html;
    expect(body(normalizeHtml(html))).toBe(expected);
  });
});

const satAttrs = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { attributes: true },
      mdastPlugins: [satteriSteps()]
    }).html
  );

// An attribute block on a line of its own, written after the steps without the body's `>`, is the step list's. Sätteri reads attribute blocks before the plugin runs and puts this one on the header's paragraph or on the body's quote, both of which recognition dissolves: the block ended up on the last step, or was lost.
describe("steps + attrs: a block on its own line after the steps goes on the list in every engine", () => {
  const cases: [string, string, string][] = [
    [
      "after a title-only step",
      "@1. A\n{.x}",
      '<ol class="markdown-steps x"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">A</p></li></ol>'
    ],
    [
      "after a body",
      "@1. A\n> body\n{.x}",
      '<ol class="markdown-steps x"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">A</p><div class="markdown-steps-body"><p>body</p></div></li></ol>'
    ],
    [
      "after a sub-step, on the outer list",
      "@1. A\n@@1. B\n{.x}",
      '<ol class="markdown-steps x"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">A</p><ol class="markdown-steps-list"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">B</p></li></ol></li></ol>'
    ]
  ];
  it.each(cases)("%s (markdown-it)", (_, input, expected) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });
  it.each(cases)("%s (remark)", (_, input, expected) => {
    expect(remd(input)).toBe(expected);
  });
  it.each(cases)("%s (sätteri)", (_, input, expected) => {
    expect(satAttrs(input)).toBe(expected);
  });
});

// A title that is only an attribute block is empty once the block is taken for the step. An empty title paragraph still takes up its line in the stylesheet, so it renders like a step written without a title: not at all.
describe("steps + attrs: a title that is only an attribute block renders no title", () => {
  const input = "@1. {.a}\n> body";
  const expected =
    '<ol class="markdown-steps"><li class="markdown-steps-item a" data-step="1"><div class="markdown-steps-body"><p>body</p></div></li></ol>';
  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(satAttrs(input)).toBe(expected));
});

// Known difference, pinned so a change to it is noticed: after a blank line, Sätteri's own attribute syntax makes the block an empty paragraph with the attributes, for any block and not only for steps, where the attrs plugins of the other engines put it on the block before it.
describe("steps + attrs: a block after a blank line, in Sätteri", () => {
  const input = "@1. A\n> body\n\n{.x}";
  it("stays an empty paragraph after the list", () => {
    expect(satAttrs(input)).toMatch(/<\/ol><p class="x"><\/p>$/);
  });
  it("is the list's in markdown-it and remark", () => {
    expect(normalizeHtml(md.render(input))).toContain(
      '<ol class="markdown-steps x">'
    );
    expect(remd(input)).toContain('<ol class="markdown-steps x">');
  });
});

// hast names the class property `className`; remd-attrs sets `class`. A plugin that sets `className` on a step or its list must not leave the element with two class attributes.
describe("steps (remark): an author class set as className joins the element's own", () => {
  it("on the list and on a step", () => {
    interface Classed {
      data?: { hProperties?: Record<string, unknown> };
      children: Classed[];
    }
    const withClassName = () => (tree: unknown) => {
      const list = (tree as Classed).children[0];
      const item = list?.children[0];
      if (!list || !item) return;
      list.data = { ...list.data, hProperties: { className: ["outer"] } };
      item.data = {
        ...item.data,
        hProperties: { className: ["inner"], id: "first" }
      };
    };
    const html = String(
      unified()
        .use(remarkParse)
        .use(remarkSteps)
        .use(withClassName)
        .use(remarkRehype, { handlers: stepsHastHandlers as never })
        .use(rehypeStringify)
        .processSync("@1. One")
    );
    expect(normalizeHtml(html)).toBe(
      '<ol class="markdown-steps outer"><li class="markdown-steps-item inner" data-step="1" id="first"><p class="markdown-steps-title">One</p></li></ol>'
    );
  });
});

// With remarkAttrs registered before remarkSteps, an attribute block is already gone from the text when steps read it, and that text still starts where the block was written. The line after it was then placed one source line too high, on the body's `>` line, so a header written under the body was missed and stayed text in the body.
describe("steps + attrs (remark, attrs first): a line after an attribute block is placed on its own source line", () => {
  const attrsFirst = (src: string) =>
    normalizeHtml(
      String(
        unified()
          .use(remarkParse)
          .use(remarkAttrs)
          .use(remarkSteps)
          .use(remarkRehype, { handlers: stepsHastHandlers as never })
          .use(rehypeStringify)
          .processSync(src)
      )
    );
  const cases: [string, string][] = [
    [
      "a header after an image with attributes starts the next step",
      "@1. A\n> ![a](x.png){.photo}\n@1. B"
    ],
    [
      "a plain line after it ends the steps",
      "@1. A\n> ![a](x.png){.photo}\nplain"
    ],
    [
      "a header in the body after it starts steps in the body",
      "@1. A\n> ![a](x.png){.photo}\n> @1. Inner"
    ],
    [
      "a header after a paragraph that ends with an image with attributes starts steps",
      "![a](x.png){.photo}\n@1. A\n> b"
    ]
  ];
  it.each(cases)("%s", (_, input) => {
    expect(attrsFirst(input)).toBe(normalizeHtml(md.render(input)));
  });
});
