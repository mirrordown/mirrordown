import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { blockIds } from "../../packages/mdit-block-ids/src";
import { activate } from "../../extensions/markdown-block-ids/src";

// What VS Code's preview does to a markdown-it instance after the contributed plugins are applied, read from its built-in Markdown extension: it wraps the `heading_open` renderer, sets the heading's id to its own slug of the text whatever id the token has, and then calls the renderer that was there before.
const asVsCodeDoes = (md: MarkdownIt): MarkdownIt => {
  const previous = md.renderer.rules.heading_open;
  md.renderer.rules.heading_open = (tokens, index, options, env, self) => {
    const text = (tokens[index + 1].children ?? [])
      .filter((child) => child.type === `text` || child.type === `code_inline`)
      .map((child) => child.content)
      .join(``);
    tokens[index].attrSet(`id`, text.toLowerCase().replaceAll(/\s+/g, `-`));
    return previous
      ? previous(tokens, index, options, env, self)
      : self.renderToken(tokens, index, options);
  };
  return md;
};

describe("block-ids/extension", () => {
  // The reason the extension does more than apply the plugin: a link to a heading's block identifier has to find the heading in the preview, as it finds a paragraph or a list item.
  it("keeps a heading's block id where VS Code would write its slug over it", () => {
    const md = asVsCodeDoes(activate().extendMarkdownIt(new MarkdownIt()));
    expect(md.render("## A heading ^head").trim()).toBe(
      '<h2 id="^head">A heading</h2>'
    );
  });

  it("loses it with the plugin alone, which is what the extension is there to prevent", () => {
    const md = asVsCodeDoes(new MarkdownIt().use(blockIds));
    expect(md.render("## A heading ^head").trim()).toBe(
      '<h2 id="a-heading">A heading</h2>'
    );
  });

  it("leaves a heading without a block id to VS Code's slug", () => {
    const md = asVsCodeDoes(activate().extendMarkdownIt(new MarkdownIt()));
    expect(md.render("## Plain heading").trim()).toBe(
      '<h2 id="plain-heading">Plain heading</h2>'
    );
  });

  it("keeps the ids of the other blocks, which VS Code leaves alone", () => {
    const md = asVsCodeDoes(activate().extendMarkdownIt(new MarkdownIt()));
    expect(md.render("A paragraph. ^para\n\n- item ^item").trim()).toBe(
      '<p id="^para">A paragraph.</p>\n<ul>\n<li id="^item">item</li>\n</ul>'
    );
  });
});
