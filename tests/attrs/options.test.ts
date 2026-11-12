import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkAttrs, type AttrsOptions } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const mdit = (options: Parameters<typeof attrs>[1], src: string) =>
  normalizeHtml(new MarkdownIt().use(attrs, options).render(src));

/** One instance of each engine, so a test can render with it more than once. */
const instances = (
  options: AttrsOptions
): [string, (src: string) => string][] => {
  const md = new MarkdownIt().use(attrs, options);
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAttrs, options)
    .use(remarkRehype)
    .use(rehypeStringify);
  return [
    ["markdown-it", (src) => normalizeHtml(md.render(src))],
    ["remark", (src) => normalizeHtml(String(processor.processSync(src)))]
  ];
};

// â”€â”€ rule: false / rule: [] â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("attrs/options", () => {
  it("rule false: no attrs applied", () => {
    expect(mdit({ rule: false }, "# Hello {.title}")).not.toContain(
      'class="title"'
    );
    expect(mdit({ rule: false }, "# Hello {.title}")).toContain(
      "<h1>Hello {.title}</h1>"
    );
  });

  it("rule empty array: no attrs applied", () => {
    expect(mdit({ rule: [] }, "# Hello {.title}")).not.toContain(
      'class="title"'
    );
  });

  it("rule true: all rules active", () => {
    expect(mdit({ rule: true }, "# Hello {.title}")).toContain('class="title"');
    expect(mdit({ rule: true }, "*em*{.foo}")).toContain('class="foo"');
  });

  // â”€â”€ rule: array of names â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it("rule array: only heading enabled", () => {
    expect(mdit({ rule: ["heading"] }, "# Hello {.title}")).toContain(
      'class="title"'
    );
    expect(mdit({ rule: ["heading"] }, "*em*{.foo}")).not.toContain(
      'class="foo"'
    );
  });

  it("rule array: only inline enabled", () => {
    expect(mdit({ rule: ["inline"] }, "*em*{.foo}")).toContain('class="foo"');
    expect(mdit({ rule: ["inline"] }, "# Hello {.title}")).not.toContain(
      'class="title"'
    );
  });

  it("rule array: fence + heading but not block", () => {
    const options: Parameters<typeof attrs>[1] = { rule: ["fence", "heading"] };
    expect(mdit(options, "```js {.hl}\ncode\n```")).toContain('class="hl');
    expect(mdit(options, "# H {.title}")).toContain('class="title"');
    expect(mdit(options, "Paragraph. {.intro}")).not.toContain('class="intro"');
  });

  // â”€â”€ allowed: string list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it("allowed string: only class permitted", () => {
    expect(mdit({ allowed: ["class"] }, "# Hello {.title #main}")).toContain(
      'class="title"'
    );
    expect(
      mdit({ allowed: ["class"] }, "# Hello {.title #main}")
    ).not.toContain('id="main"');
  });

  it("allowed string: only id permitted", () => {
    expect(mdit({ allowed: ["id"] }, "# Hello {.title #main}")).toContain(
      'id="main"'
    );
    expect(mdit({ allowed: ["id"] }, "# Hello {.title #main}")).not.toContain(
      'class="title"'
    );
  });

  it("allowed string: data-* key permitted", () => {
    expect(mdit({ allowed: ["data-x"] }, "# Hello {data-x=foo}")).toContain(
      'data-x="foo"'
    );
    expect(
      mdit({ allowed: ["data-x"] }, "# Hello {data-x=foo .bar}")
    ).not.toContain('class="bar"');
  });

  // â”€â”€ allowed: regex â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it("allowed regex: data-* pattern", () => {
    const options = { allowed: [/^data-/] };
    expect(mdit(options, "# Hello {data-x=foo data-y=bar}")).toContain(
      'data-x="foo"'
    );
    expect(mdit(options, "# Hello {data-x=foo data-y=bar}")).toContain(
      'data-y="bar"'
    );
    expect(mdit(options, "# Hello {data-x=foo .cls}")).not.toContain(
      'class="cls"'
    );
  });

  it("allowed regex: class and id via regex", () => {
    const options = { allowed: [/^(class|id)$/] };
    expect(mdit(options, "# Hello {.foo #bar data-x=baz}")).toContain(
      'class="foo"'
    );
    expect(mdit(options, "# Hello {.foo #bar data-x=baz}")).toContain(
      'id="bar"'
    );
    expect(mdit(options, "# Hello {.foo #bar data-x=baz}")).not.toContain(
      "data-x"
    );
  });

  // â”€â”€ custom delimiters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it("custom delimiters: bracket style", () => {
    const options = { left: "[", right: "]" };
    expect(mdit(options, "# Hello [.title]")).toContain('class="title"');
    expect(mdit(options, "# Hello {.title}")).not.toContain('class="title"');
  });

  it("custom delimiters: curly braces still match with default", () => {
    expect(mdit({}, "# Hello {.title}")).toContain('class="title"');
  });

  it("custom delimiters: doubled rejected", () => {
    const options = { left: "[", right: "]" };
    // [[...]] is a doubled delimiter, should not be processed
    expect(mdit(options, "# Hello [[.title]]")).not.toContain('class="title"');
  });

  // â”€â”€ attr syntax variants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it("dot notation: adds class", () => {
    expect(mdit({}, "# Hello {.foo}")).toContain('class="foo"');
  });

  it("hash notation: adds id", () => {
    expect(mdit({}, "# Hello {#my-id}")).toContain('id="my-id"');
  });

  it("double dot: css-module class", () => {
    expect(mdit({}, "# Hello {..my-module}")).toContain(
      'css-module="my-module"'
    );
  });

  it("key=value: adds data attribute", () => {
    expect(mdit({}, "# Hello {data-x=42}")).toContain('data-x="42"');
  });

  it("key=quoted value: adds attribute with spaces", () => {
    expect(mdit({}, '# Hello {title="My Heading"}')).toContain(
      'title="My Heading"'
    );
  });

  it("multiple attrs in one block", () => {
    const out = mdit({}, "# Hello {.foo #bar data-x=baz}");
    expect(out).toContain('class="foo"');
    expect(out).toContain('id="bar"');
    expect(out).toContain('data-x="baz"');
  });
});

// `allowed` is the only guard against attributes that carry script (`onclick`, `style`, a `javascript:` href) when the markdown isn't trusted, so it has to hold the same way on both engines that have it, and on every render.
describe("attrs/options: allowed", () => {
  it.each(instances({ allowed: ["class", "id"] }))(
    "%s: names off the list are dropped, in any case, and the block is still removed",
    (_engine, render) => {
      expect(render("t {.a #b onclick=x ONCLICK=y style=z}")).toBe(
        '<p class="a" id="b">t</p>'
      );
      expect(render("[x](/a){href=/b onmouseover=y}")).toBe(
        '<p><a href="/a">x</a></p>'
      );
    }
  );

  it.each(instances({ allowed: [/^data-/, "class"] }))(
    "%s: a pattern allows every name it matches",
    (_engine, render) => {
      expect(render("t {data-a=1 data-b=2 .c title=d}")).toBe(
        '<p data-a="1" data-b="2" class="c">t</p>'
      );
    }
  );

  // A global or sticky RegExp remembers where its last match ended, so testing it again from there fails every second time.
  it.each(instances({ allowed: [/^data-/g, /^aria-/y] }))(
    "%s: a global or sticky pattern allows the same names on every attribute and every render",
    (_engine, render) => {
      const src = "t {data-a=1 data-b=2 aria-label=x aria-hidden=true}";
      const html =
        '<p data-a="1" data-b="2" aria-label="x" aria-hidden="true">t</p>';
      expect(render(src)).toBe(html);
      expect(render(src)).toBe(html);
      expect(render(src)).toBe(html);
    }
  );
});

// `rule` exists so an author can turn single places off. That only works when a name covers the same places in both engines that take the option, and when a block in a place that is turned off stays in the text: one that is removed without being applied is a silent loss of what the author wrote.
describe("attrs/options: a rule name covers the same places in both engines", () => {
  const TABLE = "| a |\n| - |\n";
  const cases: [NonNullable<AttrsOptions["rule"]>, string, string][] = [
    // `block` is the end of a paragraph, and nothing another rule reads.
    [["block"], "p {.p}", '<p class="p">p</p>'],
    [["block"], "> q {.q}", '<blockquote><p class="q">q</p></blockquote>'],
    [["block"], "# H {.h}", "<h1>H {.h}</h1>"],
    [["block"], "H {.h}\n===", "<h1>H {.h}</h1>"],
    [
      ["block"],
      `${TABLE}| 1 {.td} |`,
      "<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>1 {.td}</td></tr></tbody></table>"
    ],
    [
      ["block"],
      `${TABLE}| 1 |\n{.t}`,
      "<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>1</td></tr><tr><td>{.t}</td></tr></tbody></table>"
    ],
    // A tight list never renders the paragraph of an item, so a block read as that paragraph's would vanish.
    [["block"], "- a {.li}\n- b", "<ul><li>a {.li}</li><li>b</li></ul>"],
    [["block"], "- a\n- b\n{.l}", "<ul><li>a</li><li>b\n{.l}</li></ul>"],
    [["block"], "- a\n  {.li}\n- b", "<ul><li>a\n{.li}</li><li>b</li></ul>"],
    [["block"], "- *em*{.e}", "<ul><li><em>em</em>{.e}</li></ul>"],
    [
      ["block"],
      "- a {.li}\n\n- b",
      "<ul><li><p>a {.li}</p></li><li><p>b</p></li></ul>"
    ],
    // A later paragraph of an item is an ordinary paragraph.
    [
      ["block"],
      "- a\n\n  p {.x}",
      '<ul><li><p>a</p><p class="x">p</p></li></ul>'
    ],
    // With the softbreak rule off, a block on its own line still ends the element, and takes its line ending with it.
    [["block"], "p\n{.p}", '<p class="p">p</p>'],
    [["heading"], "H\n{.h}\n===", '<h1 class="h">H</h1>'],
    [["list"], "- a\n  {.li}\n- b", '<ul><li class="li">a</li><li>b</li></ul>'],
    // Each of the other names reads its own place and leaves a paragraph's block alone.
    [["heading"], "# H {.h}\n\np {.p}", '<h1 class="h">H</h1><p>p {.p}</p>'],
    [
      ["table"],
      `${TABLE}| 1 {.td} |\n\n{.t}\n\np {.p}`,
      '<table class="t"><thead><tr><th>a</th></tr></thead><tbody><tr><td class="td">1</td></tr></tbody></table><p>p {.p}</p>'
    ],
    [
      ["list"],
      "- a {.li}\n\n{.l}\n\np {.p}",
      '<ul class="l"><li class="li">a</li></ul><p>p {.p}</p>'
    ]
  ];

  describe.each(cases)("rule %j on %j", (rule, src, expected) => {
    it.each(instances({ rule }))("%s", (_engine, render) => {
      expect(render(src)).toBe(expected);
    });
  });

  // markdown-it's end-of-block rule used to read a second block ending a heading, which remark and Sätteri leave as text.
  it.each(instances({}))(
    "%s: with every rule on, a heading still takes one block",
    (_engine, render) => {
      expect(render("# H {.a} {.b}")).toBe('<h1 class="b">H {.a}</h1>');
    }
  );
});

// A misspelt rule name used to read no block at all, which looks like the plugin not working. Both engines name the rules that exist instead.
describe("attrs/options: an unknown rule name is refused", () => {
  const message =
    'attrs: unknown rule "bogus". Use one of: fence, inline, table, list, heading, hr, softbreak, block.';

  it("markdown-it", () => {
    expect(() =>
      // @ts-expect-error intentionally invalid rule name
      new MarkdownIt().use(attrs, { rule: ["heading", "bogus"] })
    ).toThrow(new TypeError(message));
  });

  it("remark", () => {
    expect(() =>
      unified()
        .use(remarkParse)
        // @ts-expect-error intentionally invalid rule name
        .use(remarkAttrs, { rule: ["heading", "bogus"] })
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync("# H {.h}")
    ).toThrow(new TypeError(message));
  });
});
