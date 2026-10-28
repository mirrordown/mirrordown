import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import {
  satteriMermaidPele,
  type SatteriMermaidPeleOptions
} from "../../packages/sat-mermaid-pele/src";
import { normalizeHtml } from "../utils/index.js";
import { fixtures, options } from "./options.js";

const render = (
  input: string,
  gfm = false,
  settings: SatteriMermaidPeleOptions = options
) =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm, frontmatter: false, smartPunctuation: false },
      hastPlugins: [satteriMermaidPele(settings)]
    }).html
  );

describe.each(fixtures)("mermaid-pele/sat $name", ({ gfm, cases }) => {
  it.each(cases())("mermaid-pele (sätteri): $name", ({ input, expected }) => {
    expect(render(input, gfm)).toBe(expected);
  });
});

describe("mermaid-pele/sat", () => {
  it("throws on a diagram that fails to render, at its line in the document", () => {
    expect(() =>
      render("Text.\n\n```mermaid\nflowchart LR\n  A -->\n```")
    ).toThrow(/^Could not render the mermaid diagram on line 5: Parse error/);
  });

  it("replaces a failed diagram with what errorFallback returns", () => {
    const calls: unknown[][] = [];
    const html = render("```mermaid\nnot a diagram\n```", false, {
      errorFallback: (element, diagram, error) => {
        calls.push([element.tagName, diagram, error instanceof Error]);
        return { type: `text`, value: `Diagram unavailable` };
      }
    });
    expect(html).toBe(`Diagram unavailable`);
    expect(calls).toStrictEqual([[`pre`, `not a diagram\n`, true]]);
  });

  it("removes a failed diagram when errorFallback returns nothing", () => {
    expect(
      render("A\n\n```mermaid\nnot a diagram\n```\n\nB", false, {
        errorFallback: () => undefined
      })
    ).toBe(`<p>A</p><p>B</p>`);
  });
});
