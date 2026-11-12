import { describe, expect, it } from "vite-plus/test";
import { markdownIt, remark, satteri } from "./engines.js";

// What only shows when the whole suite runs together: each case here depends on the order a preset lists its plugins in, or on the escapes one plugin has to hand to the next. Alert icons are off so the titles stay readable.
const options = { githubAlerts: { icons: false } };
const md = markdownIt(options);
const rm = remark(options);
const sat = satteri(options);

/** The one rendering all three engines give, failing when they differ. */
const rendered = (input: string): string => {
  const html = md(input);
  expect(rm(input), "remark").toBe(html);
  expect(sat(input), "sätteri").toBe(html);
  return html;
};

const spoiler = (content: string): string =>
  `<label class="markdown-spoiler"><input type="checkbox" class="markdown-spoiler-toggle" aria-label="spoiler"><span class="markdown-spoiler-content">${content}</span></label>`;

const alert = (type: string, label: string, title: string, body: string) =>
  `<div class="markdown-alert" data-alert="${type}"><p class="markdown-alert-title" aria-label="${label}">${title}</p>${body}</div>`;

describe("presets: the plugins together", () => {
  // remark and Sätteri fix an alert title's `aria-label` when the alerts plugin runs, so it has to run after every plugin that rewrites inline text, or the label announces the raw markers.
  describe("an alert's title is read after the inline plugins have formatted it", () => {
    it("labels the title with its text, not its markers", () => {
      expect(
        rendered("> [!NOTE] Press [[Ctrl]] ==m== ++i++ ||s||\n> body")
      ).toBe(
        alert(
          "note",
          "Press Ctrl m i s",
          `Press <kbd>Ctrl</kbd> <mark>m</mark> <ins>i</ins> ${spoiler("s")}`,
          "<p>body</p>"
        )
      );
    });

    it("labels a ruby in the title with its base and reading", () => {
      expect(rendered("> [!NOTE] {漢字|かんじ}\n> body")).toBe(
        alert(
          "note",
          "漢字かんじ",
          "<ruby>漢字<rt>かんじ</rt></ruby>",
          "<p>body</p>"
        )
      );
    });

    it("keeps an escaped delimiter literal on both sides of the title's line break", () => {
      expect(rendered("> [!NOTE] ==a== \\==b==\n> x \\==y== ==z==")).toBe(
        alert(
          "note",
          "a ==b==",
          "<mark>a</mark> ==b==",
          "<p>x ==y== <mark>z</mark></p>"
        )
      );
    });
  });

  // markdown-it's steps and tabs rules take a header's `>` lines before any blockquote exists. remark and Sätteri only match that when steps and tabs run before alerts: otherwise the alert takes the lines first and the step or panel loses its body.
  describe("a marker line directly under a step or tab header is body text", () => {
    it("stays in the step's body", () => {
      expect(rendered("@1. Step\n> [!TIP]\n> body")).toBe(
        '<ol class="markdown-steps"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">Step</p><div class="markdown-steps-body"><p>[!TIP]\nbody</p></div></li></ol>'
      );
    });

    it("stays in the tab's panel", () => {
      const html = rendered("% Tab\n> [!NOTE]\n> body");
      expect(html).toContain(
        '<section class="markdown-tabs-panel" aria-label="Tab"><p>[!NOTE]\nbody</p></section>'
      );
      expect(html).not.toContain("markdown-alert");
    });

    it("is still an alert when it is quoted inside the body", () => {
      expect(rendered("@1. Step\n> > [!TIP]\n> > body")).toContain(
        `<div class="markdown-steps-body">${alert("tip", "Tip", "Tip", "<p>body</p>")}</div>`
      );
      expect(rendered("% Demo\n> > [!NOTE]\n> > x\n>\n% Code\n> y")).toContain(
        `<section class="markdown-tabs-panel" aria-label="Demo">${alert("note", "Note", "Note", "<p>x</p>")}</section>`
      );
    });

    it("is still an alert after the blank line that ends the step", () => {
      expect(
        rendered("@1. Step\n>  Do this.\n\n> [!NOTE]\n> A note.")
      ).toContain(`</ol>${alert("note", "Note", "Note", "<p>A note.</p>")}`);
    });
  });

  // remark's ruby plugin rebuilds a ruby from its source text, so whatever an earlier plugin did inside the braces is lost: abbr and the delimiter plugins have to come after it.
  describe("the inline plugins apply inside a ruby", () => {
    it("abbreviates a base and a reading", () => {
      expect(rendered("*[HTML]: Hyper Text\n\n{HTML|ruby} {漢字|HTML}")).toBe(
        '<p><ruby><abbr title="Hyper Text">HTML</abbr><rt>ruby</rt></ruby> <ruby>漢字<rt><abbr title="Hyper Text">HTML</abbr></rt></ruby></p>'
      );
    });

    it("formats a base", () => {
      expect(rendered("{==漢字==|かんじ}")).toBe(
        "<p><ruby><mark>漢字</mark><rt>かんじ</rt></ruby></p>"
      );
    });

    it("formats a reading", () => {
      expect(rendered("{a|==a== ++b++ --c-- [[K]]}")).toBe(
        "<p><ruby>a<rt><mark>a</mark> <ins>b</ins> <del>c</del> <kbd>K</kbd></rt></ruby></p>"
      );
    });
  });

  // markdown-it claims a key when the parser reaches `[[`, so delimiters inside it never pair with ones outside. remark and Sätteri match that only when kbd runs before the plugins whose delimiters could cross the brackets.
  describe("a key's brackets isolate the delimiters inside it", () => {
    it.each([
      ["--[[a--]]--", "<p><del><kbd>a--</kbd></del></p>"],
      ["++[[a++]]++", "<p><ins><kbd>a++</kbd></ins></p>"],
      ["[[a --b]] c--", "<p><kbd>a --b</kbd> c--</p>"],
      ["==[[a==]]==", "<p><mark><kbd>a==</kbd></mark></p>"],
      ["[[a ==b]] c==", "<p><kbd>a ==b</kbd> c==</p>"],
      ["||[[a||]]||", `<p>${spoiler("<kbd>a||</kbd>")}</p>`]
    ])("%s", (input, expected) => {
      expect(rendered(input)).toBe(expected);
    });

    it("still formats a balanced pair inside the key", () => {
      expect(rendered("[[--a--]] [[==b==]]")).toBe(
        "<p><kbd><del>a</del></kbd> <kbd><mark>b</mark></kbd></p>"
      );
    });
  });

  // GFM strikethrough is `<del>` in remark-gfm and Sätteri; markdown-it's own renders `<s>`, which the preset changes so a document does not depend on the engine.
  describe("`~~strikethrough~~` is the same element in every engine", () => {
    it("renders <del>", () => {
      expect(rendered("~~gone~~")).toBe("<p><del>gone</del></p>");
    });

    it("nests with the del plugin's `--`", () => {
      expect(rendered("~~--a--~~ --~~b~~--")).toBe(
        "<p><del><del>a</del></del> <del><del>b</del></del></p>"
      );
    });

    it("takes attributes like any other span", () => {
      expect(rendered("~~gone~~{.old}")).toBe(
        '<p><del class="old">gone</del></p>'
      );
    });
  });

  // A plugin that splits a text node hands the pieces on without their source positions, so it must also hand on which characters were escaped, or the next plugin reads `\==` as a delimiter.
  describe("an escaped delimiter is text, whichever plugin ran before the one that reads it", () => {
    it.each([
      ["--a-- \\==b==", "<p><del>a</del> ==b==</p>"],
      ["--\\++a++--", "<p><del>++a++</del></p>"],
      ["[[k]] \\||a||", "<p><kbd>k</kbd> ||a||</p>"],
      [
        "*[HTML]: Hyper Text\n\nHTML \\==a==",
        '<p><abbr title="Hyper Text">HTML</abbr> ==a==</p>'
      ]
    ])("%s", (input, expected) => {
      expect(rendered(input)).toBe(expected);
    });
  });

  // remark and Sätteri read a definition from a paragraph that is one plain line of text, so abbr has to run before the plugins that would format that line. It is why abbr cannot move after alerts and attrs, which would settle two of the cases pinned below.
  describe("an abbreviation's definition is read before the other plugins format it", () => {
    it("keeps another plugin's delimiters in the title as written", () => {
      expect(rendered("*[a]: Hyper ==Text== [[K]] --x--\n\na z")).toBe(
        '<p><abbr title="Hyper ==Text== [[K]] --x--">a</abbr> z</p>'
      );
    });
  });

  // Known differences no order of plugins removes. Each is pinned so a change in any engine shows up here; when one is fixed in its plugin, move the case to the groups above.
  describe("pinned: where the engines still differ", () => {
    // markdown-it reads a definition as a block and replaces terms after inline parsing. remark and Sätteri do both in one pass, which has to run before the plugins that would format a definition's own text, and so before alerts and attrs.
    it("an abbreviation equal to an alert's keyword stops the alert in remark and Sätteri", () => {
      const input = "*[NOTE]: A note abbr\n\n> [!NOTE]\n> body NOTE";
      const term = '<abbr title="A note abbr">NOTE</abbr>';
      expect(md(input)).toBe(
        alert("note", "Note", "Note", `<p>body ${term}</p>`)
      );
      const blockquote = `<blockquote><p>[!${term}]\nbody ${term}</p></blockquote>`;
      expect(rm(input)).toBe(blockquote);
      expect(sat(input)).toBe(blockquote);
    });

    it("a term inside an attribute block keeps the block from being read in remark", () => {
      const definition = "*[HTML]: Hyper Text\n\n";
      const term = '<abbr title="Hyper Text">HTML</abbr>';
      const paragraph = `${definition}Text HTML {.HTML}`;
      expect(md(paragraph)).toBe(`<p class="HTML">Text ${term}</p>`);
      expect(sat(paragraph)).toBe(md(paragraph));
      expect(rm(paragraph)).toBe(`<p>Text ${term} {.${term}}</p>`);

      const value = `${definition}Text {data-x="HTML"}`;
      expect(md(value)).toBe('<p data-x="HTML">Text</p>');
      expect(sat(value)).toBe(md(value));
      expect(rm(value)).toBe(`<p>Text {data-x="${term}"}</p>`);
    });

    // remark parses a ruby with the document and Sätteri's ruby plugin has to run first, so in both the definition is no longer one plain line of text by the time abbr reads it.
    it("a definition whose title holds a ruby is not a definition in remark and Sätteri", () => {
      const input = "*[a]: Hyper {x|y}\n\na z";
      expect(md(input)).toBe('<p><abbr title="Hyper {x|y}">a</abbr> z</p>');
      const paragraphs =
        "<p>*[a]: Hyper <ruby>x<rt>y</rt></ruby></p><p>a z</p>";
      expect(rm(input)).toBe(paragraphs);
      expect(sat(input)).toBe(paragraphs);
    });

    // markdown-it has no footnotes of its own and the preset adds no dependency for them: `[^1]: Note.` is a link reference definition there.
    it("footnotes are GFM's, which the markdown-it preset does not have", () => {
      const input = "Text[^1] and x^2^.\n\n[^1]: Note.";
      expect(md(input)).toBe(
        '<p>Text<a href="Note.">^1</a> and x<sup>2</sup>.</p>'
      );
      const footnotes = rm(input);
      expect(footnotes).toContain(
        '<p>Text<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref aria-describedby="footnote-label">1</a></sup> and x<sup>2</sup>.</p><section data-footnotes class="footnotes">'
      );
      expect(sat(input)).toBe(footnotes);
    });

    // The rest of GFM that markdown-it does not read by default. The preset leaves markdown-it's parser configuration alone.
    it("task lists and bare URLs are GFM's too", () => {
      const tasks = "- [ ] todo\n- [x] done";
      expect(md(tasks)).toBe("<ul><li>[ ] todo</li><li>[x] done</li></ul>");
      expect(rm(tasks)).toContain(
        '<li class="task-list-item"><input type="checkbox" disabled> todo</li>'
      );
      expect(sat(tasks)).toBe(rm(tasks));

      const url = "see www.example.com now";
      expect(md(url)).toBe(`<p>${url}</p>`);
      expect(rm(url)).toBe(
        '<p>see <a href="http://www.example.com">www.example.com</a> now</p>'
      );
      expect(sat(url)).toBe(rm(url));
    });

    // Each engine writes a column's alignment its own way; none is a plugin's doing.
    it("an aligned table column is written three ways", () => {
      const input = "| a |\n| :-: |\n| 1 |";
      expect(md(input)).toContain('<th style="text-align:center">a</th>');
      expect(rm(input)).toContain('<th align="center">a</th>');
      expect(sat(input)).toContain('<th style="text-align: center">a</th>');
    });
  });
});
