import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { mermaidPele } from "../../packages/mdit-mermaid-pele/src";
import { fixtures, options } from "./options.js";

const md = new MarkdownIt().use(mermaidPele, options);

describe("mermaid-pele/mdit", () => {
  // markdown-it writes the expected HTML the other engines are held to.
  it.each(fixtures)(
    "mermaid-pele (markdown-it): $name fixtures",
    async ({ inputs, expectedPath }) => {
      const html = inputs
        .map(
          ({ name, input }) => `<!-- @case: ${name} -->\n\n${md.render(input)}`
        )
        .join(`\n`);
      await expect(html).toMatchFileSnapshot(expectedPath);
    }
  );

  it("throws on a diagram that fails to render, at its line in the document", () => {
    expect(() =>
      md.render("Text.\n\n```mermaid\nflowchart LR\n  A -->\n```")
    ).toThrow(/^Could not render the mermaid diagram on line 5: Parse error/);
  });

  it("throws at the fence's line when Pele has no location", () => {
    expect(() => md.render("```mermaid\nnot a diagram\n```")).toThrow(
      "Could not render the mermaid diagram on line 1: No diagram type detected for the given text."
    );
  });

  it("replaces a failed diagram with what errorFallback returns", () => {
    const calls: unknown[][] = [];
    const fallback = new MarkdownIt().use(mermaidPele, {
      errorFallback: (token, diagram, error, env) => {
        calls.push([token.type, diagram, error instanceof Error, env]);
        return `<p>Diagram unavailable</p>\n`;
      }
    });
    const env = { page: 1 };
    expect(fallback.render("```mermaid\nnot a diagram\n```", env)).toBe(
      `<p>Diagram unavailable</p>\n`
    );
    expect(calls).toStrictEqual([[`fence`, `not a diagram\n`, true, env]]);
  });

  it("removes a failed diagram when errorFallback returns nothing", () => {
    const fallback = new MarkdownIt().use(mermaidPele, {
      errorFallback: () => undefined
    });
    expect(fallback.render("A\n\n```mermaid\nnot a diagram\n```\n\nB")).toBe(
      `<p>A</p>\n<p>B</p>\n`
    );
  });

  it("starts each diagram's ids with the prefix option", () => {
    const html = new MarkdownIt()
      .use(mermaidPele, { prefix: `chart` })
      .render("```mermaid\nsequenceDiagram\n  accTitle: T\n  A->>B: hi\n```");
    expect(html).toMatch(/<title id="chart-[a-z0-9]+-title">T<\/title>/);
  });
});
