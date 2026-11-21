import { describe, expect, it } from "vite-plus/test";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import { remarkTags } from "../../packages/remd-tags/src";
import { satteriTags } from "../../packages/sat-tags/src";

// Astro hands a plugin the page's frontmatter as a mutable object (`file.data.astro.frontmatter`, `ctx.data.astro.frontmatter`) and returns it with the render as `metadata.frontmatter`, which a page reads as `remarkPluginFrontmatter`. The tags plugins keep its `tags` as the note's tags the way Obsidian counts them: the listed ones first, then the inline ones not among them.
const processors = [
  [
    `remark`,
    async () =>
      createMarkdownProcessor({
        syntaxHighlight: false,
        remarkPlugins: [remarkTags]
      })
  ],
  [
    `sätteri`,
    async () =>
      createSatteriMarkdownProcessor({
        syntaxHighlight: false,
        mdastPlugins: [satteriTags()]
      })
  ]
] as const;

describe.each(processors)("tags in Astro's %s processor", (_, create) => {
  it("merges the inline tags into the frontmatter's tags", async () => {
    const { code, metadata } = await (
      await create()
    ).render(`Filed under #Work, #inbox/to-read and #later.`, {
      frontmatter: { title: `Note`, tags: [`work`, `#project`] }
    });
    expect(metadata.frontmatter).toEqual({
      title: `Note`,
      tags: [`work`, `project`, `inbox/to-read`, `later`]
    });
    expect(code).toContain(`<a class="tag" href="#Work">#Work</a>`);
  });

  it("gives a frontmatter without tags the document's", async () => {
    const { metadata } = await (
      await create()
    ).render(`#one and #two`, { frontmatter: { title: `Note` } });
    expect(metadata.frontmatter.tags).toEqual([`one`, `two`]);
  });

  it("leaves tags it cannot read as the frontmatter has them", async () => {
    const { metadata } = await (
      await create()
    ).render(`#one`, { frontmatter: { tags: 42 } });
    expect(metadata.frontmatter.tags).toBe(42);
  });
});
