import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { sub } from "../../packages/mdit-sub/src";
import { normalizeHtml } from "../utils/index.js";

// Regression: mdit-spoiler's replacement `text` rule must return false (not a non-advancing true) when state.pos === state.posMax, or a rule that probes at the boundary with `skipToken` loops forever (older markdown-it) / throws "inline rule didn't increment state.pos" (markdown-it 14). mdit-sub's rule used to probe that way when it met an unclosed `~`, which is how the hang was found. It no longer scans ahead: it returns false in silent mode and otherwise always advances past the tilde run, so these inputs now pin both rules' side of the contract.
describe("spoiler + sub: unclosed tilde must terminate", () => {
  const md = new MarkdownIt().use(spoiler).use(sub);
  const render = (src: string) => normalizeHtml(md.render(src));

  it("does not hang or throw on an unclosed ~", () => {
    // The minimal repro from the bug report. Must return promptly, not wedge.
    expect(render("about ~15k lines")).toBe("<p>about ~15k lines</p>");
  });

  it("handles an unclosed ~ adjacent to a spoiler", () => {
    expect(render("~15k ||secret||")).toBe(
      '<p>~15k <label class="markdown-spoiler">' +
        '<input type="checkbox" class="markdown-spoiler-toggle" aria-label="spoiler">' +
        '<span class="markdown-spoiler-content">secret</span></label></p>'
    );
  });

  it("still renders a well-formed subscript alongside a spoiler", () => {
    expect(render("H~2~O and ||spoiler||")).toBe(
      "<p>H<sub>2</sub>O and " +
        '<label class="markdown-spoiler">' +
        '<input type="checkbox" class="markdown-spoiler-toggle" aria-label="spoiler">' +
        '<span class="markdown-spoiler-content">spoiler</span></label></p>'
    );
  });
});

// Bug 1 in isolation: the replacement `text` rule is a landmine for ANY plugin
// that probes at the inline boundary, so verify spoiler alone terminates on
// content that ends exactly at a would-be empty text slice.
describe("spoiler alone: text rule terminates at the boundary", () => {
  const md = new MarkdownIt().use(spoiler);
  const render = (src: string) => normalizeHtml(md.render(src));

  it("renders a trailing unclosed pipe without hanging", () => {
    expect(render("text ending in a pipe|")).toBe(
      "<p>text ending in a pipe|</p>"
    );
  });

  it("renders a lone tilde without hanging", () => {
    expect(render("about ~15k")).toBe("<p>about ~15k</p>");
  });
});
