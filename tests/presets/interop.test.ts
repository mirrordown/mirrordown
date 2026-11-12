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
});
