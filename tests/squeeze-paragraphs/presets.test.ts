import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { mirrordown as markdownItPreset } from "../../packages/preset-markdown-it/src";
import { mirrordown as remarkPreset } from "../../packages/preset-remark/src";
import { mirrordown as satteriPreset } from "../../packages/preset-satteri/src";

// squeeze-paragraphs removes the empty `<p>` the other plugins leave, so it has to run after all of them. Today every plugin that empties a paragraph happens to run in an earlier phase than squeeze whatever the list order, so no rendering test would catch squeeze being moved up a preset's list: this pins the position itself, for the first plugin that does depend on it.
describe("squeeze-paragraphs is the last plugin each preset runs", () => {
  it("markdown-it: the last core rule", () => {
    const md = new MarkdownIt().use(markdownItPreset);
    // markdown-it has no public way to list a chain's rule names.
    const { __rules__: rules } = md.core.ruler as unknown as {
      __rules__: Array<{ name: string }>;
    };
    expect(rules.at(-1)?.name).toBe(`squeeze_paragraphs`);
  });

  it("remark: the last rehype plugin", () => {
    const last = remarkPreset().rehypePlugins.at(-1);
    expect(typeof last === `function` && last.name).toBe(
      `rehypeSqueezeParagraphs`
    );
  });

  it("sätteri: the last hast plugin", () => {
    const last = satteriPreset().hastPlugins.at(-1);
    expect(last?.({} as never).name).toBe(`squeeze-paragraphs`);
  });
});
