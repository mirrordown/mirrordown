import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import { attrs } from "../../packages/mdit-attrs/src";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers
} from "../../packages/remd-github-alerts/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriGithubAlerts } from "../../packages/sat-github-alerts/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(githubAlerts).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGithubAlerts)
        .use(remarkAttrs)
        .use(remarkRehype, { handlers: githubAlertsHastHandlers })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(src)
    )
  );

describe("github-alerts + attrs: heading with attrs alongside alert", () => {
  const input = "## Notes {.section}\n\n> [!NOTE]\n> Some note content.";

  it("markdown-it and remark render identically", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('<h2 class="section">Notes</h2>');
    expect(result).toContain('data-alert="note"');
    expect(remd(input)).toBe(result);
  });
});

describe("github-alerts + attrs: paragraph with attrs after alert", () => {
  const input = "> [!TIP]\n> A helpful tip.\n\nRead more. {.callout}";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="callout"');
    expect(result).toContain('data-alert="tip"');
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="callout"');
    expect(result).toContain('data-alert="tip"');
  });
});

describe("github-alerts + attrs: alerts and attrs coexist", () => {
  const input = "> [!WARNING]\n> Be careful.\n\n> [!NOTE]\n> Just a note.";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('data-alert="warning"');
    expect(result).toContain('data-alert="note"');
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('data-alert="warning"');
    expect(result).toContain('data-alert="note"');
  });
});

describe("github-alerts + attrs: id on standalone paragraph after alert applies to container", () => {
  const input = "> [!NOTE]\n> Some note content.\n\n{#my-note}";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('id="my-note"');
    expect(result).toContain('data-alert="note"');
    // {#my-note} consumed — not rendered as a standalone paragraph
    expect(result).not.toContain('<p id="my-note"');
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('id="my-note"');
    expect(result).toContain('data-alert="note"');
    expect(result).not.toContain('<p id="my-note"');
  });
});

describe("github-alerts + attrs: class on standalone paragraph after alert applies to container", () => {
  const input = "> [!TIP]\n> A helpful tip.\n\n{.custom-alert}";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain("markdown-alert custom-alert");
    expect(result).toContain('data-alert="tip"');
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain("markdown-alert custom-alert");
    expect(result).toContain('data-alert="tip"');
  });
});

// The title's class is the alert's own, whatever classes the container gains: it was derived from the container's `class` after attrs had added to it, which gave `markdown-alert foo-title` and lost the title its styles.
describe("github-alerts + attrs: classes on the container leave the title's class alone", () => {
  it.each(["> [!NOTE]\n> body\n\n{.foo #bar}", "> [!NOTE]+\n> body\n\n{.foo}"])(
    "markdown-it and remark render identically: %j",
    (input) => {
      const result = normalizeHtml(md.render(input));
      expect(result).toContain('class="markdown-alert foo"');
      expect(result).toContain('class="markdown-alert-title"');
      expect(remd(input)).toBe(result);
    }
  );
});

// A plugin that runs before alerts may have put attributes on the blockquote; turning it into an alert must add to them, not replace them.
describe("github-alerts + attrs: attributes already on the blockquote", () => {
  it("stay on the alert when remark-attrs runs first", () => {
    const html = normalizeHtml(
      String(
        unified()
          .use(remarkParse)
          .use(remarkAttrs)
          .use(remarkGithubAlerts, { icons: false })
          .use(remarkRehype, { handlers: githubAlertsHastHandlers })
          .use(rehypeStringify)
          .processSync("> [!NOTE]\n> body\n{.foo #bar}")
      )
    );
    expect(html).toBe(
      '<div class="markdown-alert foo" data-alert="note" id="bar"><p class="markdown-alert-title" aria-label="Note">Note</p><p>body</p></div>'
    );
  });
});

// The cases below compare whole alerts across the three engines, without icons. Sätteri reads attribute blocks itself, while it parses and so before the alert exists; the other two run their attrs plugin after the alert is built, as the presets order them.
const plain = new MarkdownIt().use(githubAlerts, { icons: false }).use(attrs);
const engines: [string, (src: string) => string][] = [
  ["markdown-it", (src) => normalizeHtml(plain.render(src))],
  [
    "remark",
    (src) =>
      normalizeHtml(
        String(
          unified()
            .use(remarkParse)
            .use(remarkGithubAlerts, { icons: false })
            .use(remarkAttrs)
            .use(remarkRehype, { handlers: githubAlertsHastHandlers })
            .use(rehypeStringify)
            .processSync(src)
        )
      )
  ],
  [
    "sätteri",
    (src) =>
      normalizeHtml(
        markdownToHtml(src, {
          features: {
            gfm: false,
            frontmatter: false,
            smartPunctuation: false,
            attributes: true
          },
          mdastPlugins: [satteriGithubAlerts({ icons: false })]
        }).html
      )
  ]
];

const alert = (
  container: string,
  title: string,
  body: string,
  label = "Note"
): string =>
  `<div class="markdown-alert${container}><p class="markdown-alert-title" aria-label="${label}">${title}</p>${body}</div>`;

// A line after a blockquote without its `>` continues it, and a block written there is the blockquote's (see the attrs guide). An alert is that blockquote. Sätteri's parser had put the attributes on the blockquote, and the alert that replaced it dropped them; markdown-it and remark no longer saw a blockquote and gave them to the body's paragraph.
describe.each(engines)(
  "github-alerts + attrs: a block on a line after the alert, without its `>` (%s)",
  (_engine, render) => {
    it.each([
      [
        "goes on the alert",
        "> [!NOTE]\n> body\n{.foo}",
        alert(' foo" data-alert="note"', "Note", "<p>body</p>")
      ],
      [
        "with an id, after the alert's own attributes",
        "> [!NOTE]\n> body\n{.foo #bar}",
        alert(' foo" data-alert="note" id="bar"', "Note", "<p>body</p>")
      ],
      [
        "after a body of several blocks",
        "> [!NOTE]\n> body\n>\n> more\n{.foo}",
        alert(' foo" data-alert="note"', "Note", "<p>body</p><p>more</p>")
      ],
      [
        "written with the `>`, it is the body paragraph's",
        "> [!NOTE]\n> body\n> {.foo}",
        alert('" data-alert="note"', "Note", '<p class="foo">body</p>')
      ],
      [
        "around a nested alert, one `>` short of it",
        "> > [!NOTE]\n> > body\n> {.foo}",
        `<blockquote>${alert(' foo" data-alert="note"', "Note", "<p>body</p>")}</blockquote>`
      ]
    ])("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });

    it("on a foldable alert, goes on the details element", () => {
      expect(render("> [!NOTE]+ T\n> body\n{.foo}")).toBe(
        '<details class="markdown-alert foo" data-alert="note" open><summary class="markdown-alert-title" aria-label="T">T</summary><p>body</p></details>'
      );
    });
  }
);

// The label is what a screen reader announces for the title, so it is the title's text and never the syntax around it. markdown-it and remark set it when the alert is built, before their attrs plugin takes the block off the title, and read `T{.foo}` out.
describe.each(engines)(
  "github-alerts + attrs: the title's label leaves out an attribute block (%s)",
  (_engine, render) => {
    it.each([
      [
        "after an element that is the whole title",
        "> [!NOTE] *T*{.foo}\n> body",
        alert(
          '" data-alert="note"',
          '<em class="foo">T</em>',
          "<p>body</p>",
          "T"
        )
      ],
      [
        "after an element inside the title",
        "> [!NOTE] *T*{.foo} more\n> body",
        alert(
          '" data-alert="note"',
          '<em class="foo">T</em> more',
          "<p>body</p>",
          "T more"
        )
      ]
    ])("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  }
);

// Open question for the plugin's owner: whether a block that ends the title line is supported. Until it is decided the engines differ, and these pin each one so a change shows. markdown-it's attrs plugin gives the block to the title; whatever it leaves, the title keeps text and a label that matches it, where it once lost the title element altogether. remark has no rule for an alert's title, and Sätteri's parser sees a block in the middle of a paragraph, which it leaves as text.
describe("github-alerts + attrs: a block ending the title line, which the engines read differently", () => {
  const [[, mdit], [, remd], [, sat]] = engines;

  it("after a title", () => {
    const input = "> [!NOTE] Title {.foo}\n> body";
    const text = alert(
      '" data-alert="note"',
      "Title {.foo}",
      "<p>body</p>",
      "Title {.foo}"
    );
    expect(mdit(input)).toBe(
      '<div class="markdown-alert" data-alert="note"><p class="markdown-alert-title foo" aria-label="Title">Title</p><p>body</p></div>'
    );
    expect(remd(input)).toBe(text);
    expect(sat(input)).toBe(text);
  });

  it("right after the marker, where markdown-it puts the type's own title back", () => {
    const input = "> [!NOTE]{.foo}\n> body";
    const text = alert(
      '" data-alert="note"',
      "{.foo}",
      "<p>body</p>",
      "{.foo}"
    );
    expect(mdit(input)).toBe(
      '<div class="markdown-alert" data-alert="note"><p class="markdown-alert-title foo" aria-label="Note">Note</p><p>body</p></div>'
    );
    expect(remd(input)).toBe(text);
    expect(sat(input)).toBe(text);
  });
});

// Engine limit (Sätteri). A block after a blank line is the previous block's in markdown-it and remark, which is how an alert is given an id. Sätteri's parser reads a paragraph that is only a block as an empty paragraph carrying the attributes, before any plugin runs, so the alert never sees them.
describe("github-alerts + attrs, engine limit: a block after a blank line", () => {
  const [[, mdit], [, remd], [, sat]] = engines;
  const input = "> [!NOTE]\n> body\n\n{.foo #bar}";

  it.each([
    ["markdown-it", mdit],
    ["remark", remd]
  ] as const)("%s puts it on the alert", (_engine, render) => {
    expect(render(input)).toBe(
      alert(' foo" data-alert="note" id="bar"', "Note", "<p>body</p>")
    );
  });

  it("sätteri leaves an empty paragraph with the attributes after the alert", () => {
    expect(sat(input)).toBe(
      `${alert('" data-alert="note"', "Note", "<p>body</p>")}<p class="foo" id="bar"></p>`
    );
  });
});

// Not an engine limit: an alert with no body, followed by a line without its `>`. Sätteri's parser gives the block to the blockquote, and so to the alert. In markdown-it and remark the line is all that is left of the alert's paragraph once the marker is taken, and it is read as a paragraph of its own inside the alert.
describe("github-alerts + attrs: a block on the line after a marker with no body, which the engines read differently", () => {
  const [[, mdit], [, remd], [, sat]] = engines;
  const input = "> [!NOTE]\n{.foo}";

  it("sätteri puts it on the alert", () => {
    expect(sat(input)).toBe(alert(' foo" data-alert="note"', "Note", ""));
  });

  it.each([
    ["markdown-it", mdit],
    ["remark", remd]
  ] as const)(
    "%s leaves an empty paragraph with the class inside the alert",
    (_engine, render) => {
      expect(render(input)).toBe(
        alert('" data-alert="note"', "Note", '<p class="foo"></p>')
      );
    }
  );
});
