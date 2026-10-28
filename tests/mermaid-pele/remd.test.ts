import { describe, expect, it } from "vite-plus/test";
import type { Element, Root } from "hast";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import {
  rehypeMermaidPele,
  type RehypeMermaidPeleOptions
} from "../../packages/remd-mermaid-pele/src";
import { normalizeHtml } from "../utils/index.js";
import { fixtures, options } from "./options.js";

const processor = (
  gfm: boolean,
  settings: RehypeMermaidPeleOptions = options
) =>
  unified()
    .use(remarkParse)
    .use(gfm ? [remarkGfm] : [])
    .use(remarkRehype)
    .use(rehypeMermaidPele, settings)
    .use(rehypeStringify, { allowDangerousHtml: true });

const render = (input: string, gfm = false) =>
  normalizeHtml(String(processor(gfm).processSync(input)));

describe.each(fixtures)("mermaid-pele/remd $name", ({ gfm, cases }) => {
  it.each(cases())("mermaid-pele (remark): $name", ({ input, expected }) => {
    expect(render(input, gfm)).toBe(expected);
  });
});

describe("mermaid-pele/remd", () => {
  it("fails the file on a diagram that fails to render, at its line in the document", () => {
    let thrown: unknown;
    try {
      processor(false).processSync(
        "Text.\n\n```mermaid\nflowchart LR\n  A -->\n```"
      );
    } catch (error) {
      thrown = error;
    }
    // A fatal vfile message, located at the whole fence, as rehype-mermaid reports one.
    expect(thrown).toMatchObject({
      fatal: true,
      ruleId: `mermaid-pele`,
      source: `@mirrordown/remd-mermaid-pele`,
      place: { start: { line: 3, column: 1 }, end: { line: 6, column: 4 } },
      reason: expect.stringMatching(
        /^Could not render the mermaid diagram on line 5: Parse error/
      )
    });
  });

  it("replaces a failed diagram with what errorFallback returns", async () => {
    const calls: unknown[][] = [];
    const file = await processor(false, {
      errorFallback: (element, diagram, error, vfile) => {
        calls.push([
          element.tagName,
          diagram,
          error instanceof Error,
          vfile.path
        ]);
        return { type: `text`, value: `Diagram unavailable` };
      }
    }).process({ value: "```mermaid\nnot a diagram\n```", path: `doc.md` });
    expect(String(file)).toBe(`Diagram unavailable`);
    expect(calls).toStrictEqual([[`pre`, `not a diagram\n`, true, `doc.md`]]);
  });

  it("removes a failed diagram when errorFallback returns nothing", () => {
    const html = processor(false, {
      errorFallback: () => undefined
    }).processSync("A\n\n```mermaid\nnot a diagram\n```\n\nB");
    expect(normalizeHtml(String(html))).toBe(`<p>A</p><p>B</p>`);
  });
});

// rehype-mermaid also reads diagrams written as HTML, which markdown-it and Sätteri keep as raw HTML, so these trees are built by hand.
describe("mermaid-pele/remd: diagrams in HTML", () => {
  const pre = (
    properties: Element["properties"],
    children: Element["children"]
  ): Root => ({
    type: `root`,
    children: [{ type: `element`, tagName: `pre`, properties, children }]
  });
  const code = (className: string | string[], value: string): Element => ({
    type: `element`,
    tagName: `code`,
    properties: { className },
    children: [{ type: `text`, value }]
  });
  const html = unified()
    .use(rehypeMermaidPele, options)
    .use(rehypeStringify, { allowDangerousHtml: true });
  const run = (tree: Root) => normalizeHtml(html.stringify(html.runSync(tree)));
  const diagram = `flowchart LR\n  A --> B\n`;
  const rendered = render("```mermaid\n" + diagram + "```");

  it('renders a <pre class="mermaid">', () => {
    expect(
      run(pre({ className: [`mermaid`] }, [{ type: `text`, value: diagram }]))
    ).toBe(rendered);
  });

  it("reads a class name written as a string", () => {
    expect(run(pre({}, [code(`language-mermaid`, diagram)]))).toBe(rendered);
  });

  it("reads a highlighted diagram's text", () => {
    const highlighted: Element = {
      type: `element`,
      tagName: `code`,
      properties: { className: [`language-mermaid`] },
      children: [
        {
          type: `element`,
          tagName: `span`,
          properties: { className: [`keyword`] },
          children: [{ type: `text`, value: `flowchart` }]
        },
        { type: `text`, value: ` LR\n  A --> B\n` }
      ]
    };
    expect(run(pre({}, [highlighted]))).toBe(rendered);
  });

  it("allows whitespace around the code", () => {
    expect(
      run(
        pre({}, [
          { type: `text`, value: `\n  ` },
          code([`language-mermaid`], diagram),
          { type: `text`, value: `\n` }
        ])
      )
    ).toBe(rendered);
  });

  it("leaves a <pre> with other text beside the code alone", () => {
    const tree = pre({}, [
      { type: `text`, value: `Ignored. ` },
      code([`language-mermaid`], diagram)
    ]);
    expect(run(tree)).toMatch(
      /^<pre>Ignored\. <code class="language-mermaid">flowchart LR/
    );
  });

  it("leaves a <pre> with another element beside the code alone", () => {
    const tree = pre({}, [
      code([`language-mermaid`], diagram),
      code([`language-mermaid`], diagram)
    ]);
    expect(run(tree)).not.toContain(`<svg`);
  });
});
