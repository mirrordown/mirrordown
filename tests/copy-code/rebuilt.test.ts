import { describe, expect, it } from "vite-plus/test";
import type { Root } from "hast";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { markdownToHtml } from "satteri";
import { rehypeCopyCode } from "../../packages/remd-copy-code/src";
import { satteriCopyCode } from "../../packages/sat-copy-code/src";

// Hosts such as Astro highlight code before the plugins run, rebuilding each block from its code, language and meta: the <code> loses the meta, so `nocopy` must survive as the <pre>'s `data-meta`, which the guide's Shiki transformer writes. Simulated here by moving the meta onto the <pre>.
const input = "```sh nocopy\n$ npm test\n```";
const BUTTON = `class="markdown-copy-code"`;

const rebuildRemark = () => (tree: Root) => {
  visit(tree, `element`, (node) => {
    const [code] = node.children;
    if (node.tagName !== `pre` || code?.type !== `element`) return;
    const meta = code.data?.meta;
    delete code.data;
    if (meta) node.properties.dataMeta = meta;
  });
};

describe("copy-code: a block rebuilt by a highlighter", () => {
  it(`keeps nocopy from the <pre>'s data-meta (remark)`, () => {
    const html = String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rebuildRemark)
        .use(rehypeCopyCode)
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(input)
    );
    expect(html).toContain(`<pre data-meta="nocopy">`);
    expect(html).not.toContain(BUTTON);
  });

  it(`keeps nocopy from the <pre>'s data-meta (sätteri)`, () => {
    const { html } = markdownToHtml(input, {
      hastPlugins: [
        () => ({
          name: `rebuild`,
          element: {
            filter: [`pre`],
            visit(node, ctx) {
              const [code] = node.children;
              if (code?.type !== `element`) return;
              // Sätteri keeps the fence's meta on the <code>'s data, which its types don't declare.
              const data: { meta?: unknown } | undefined = code.data;
              const meta = data?.meta;
              ctx.setField(code, `data`, null);
              if (typeof meta === `string`)
                ctx.setProperty(node, `dataMeta`, meta);
            }
          }
        }),
        satteriCopyCode()
      ]
    });
    expect(html).toContain(`<pre data-meta="nocopy">`);
    expect(html).not.toContain(BUTTON);
  });
});
