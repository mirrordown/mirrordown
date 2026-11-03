import { describe, expect, it } from "vite-plus/test";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import type { ShikiConfig } from "@astrojs/markdown-remark";
import { rehypePrompt, remarkPrompt } from "../../packages/remd-prompt/src";
import {
  satteriPrompt,
  satteriPromptPreview
} from "../../packages/sat-prompt/src";

// Astro highlights code with Shiki before the plugins run. The guide's setup: `prompt` read as markdown, and the fence's meta kept on the <pre>, where the plugins read it.
const shikiConfig: Partial<ShikiConfig> = {
  theme: `github-dark`,
  langAlias: { prompt: `markdown` },
  transformers: [
    {
      pre(node): void {
        const meta = this.options.meta?.__raw;
        if (meta) node.properties.dataMeta = meta;
      }
    }
  ]
};

const input =
  '```prompt open title="Ask" cursor\n# Task\n\nRead `README.md`.\n```';

const processors = [
  [
    `remark`,
    async () =>
      createMarkdownProcessor({
        syntaxHighlight: { type: `shiki` },
        shikiConfig,
        remarkPlugins: [remarkPrompt],
        rehypePlugins: [[rehypePrompt, {}]]
      })
  ],
  [
    `sätteri`,
    async () =>
      createSatteriMarkdownProcessor({
        syntaxHighlight: { type: `shiki` },
        shikiConfig,
        mdastPlugins: [satteriPromptPreview()],
        hastPlugins: [satteriPrompt()]
      })
  ]
] as const;

describe.each(processors)("prompt in Astro's %s processor", (_, create) => {
  // The prompt's markdown view takes Shiki's highlighting of it as markdown, in its theme like the page's other code blocks, and the plugin reads the meta Shiki would otherwise drop.
  it("keeps Shiki's markdown highlighting, theme and the fence's meta", async () => {
    const { code } = await (await create()).render(input);
    expect(code).toContain(`<div class="markdown-prompt">`);
    expect(code).toContain(`<details class="markdown-prompt-details" open>`);
    expect(code).toContain(`Ask</summary>`);
    expect(code).toMatch(
      /class="markdown-prompt-body astro-code github-dark" style="background-color:#24292e;color:#e1e4e8/
    );
    // The preview renders the prompt's markdown, apart from the highlighting.
    expect(code).toMatch(
      /<div class="markdown-prompt-preview"><h1[^>]*>Task<\/h1>/
    );
    // A markdown heading's colored span: Shiki read the prompt as markdown, not plain text.
    expect(code).toMatch(
      /<span class="line"><span style="color:#[0-9A-F]{6};font-weight:bold"># Task<\/span><\/span>/i
    );
    expect(code).toContain(`data-service="cursor"`);
    // The form carries the prompt as written; Astro may encode its backticks when it writes the attribute again.
    expect(code).toMatch(
      /name="text" value="# Task\n\nRead (`|&#x60;)README\.md(`|&#x60;)\."/
    );
  });
});
