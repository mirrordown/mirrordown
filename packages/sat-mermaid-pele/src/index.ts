import {
  hastAttributes,
  mermaidDiagram,
  mermaidFailure,
  mermaidIdPrefixes,
  mermaidSvg
} from "@mirrordown/core";
import { render, type RenderOptions } from "pele";
import {
  defineHastPlugin,
  type HastNode,
  type HastVisitorContext,
  type HastVisitorInstance,
  type PluginFactoryContext
} from "satteri";

type ElementVisitor = Extract<
  NonNullable<HastVisitorInstance["element"]>,
  { filter: string[] }
>;
type Element = Parameters<ElementVisitor["visit"]>[0];

/** Options for {@link satteriMermaidPele}: Pele's render options, besides the id prefix, which is set per diagram. */
export interface SatteriMermaidPeleOptions extends Omit<
  RenderOptions,
  "idPrefix"
> {
  /**
   * The start of each diagram's id prefix, followed by a hash of the diagram, so several diagrams on a page don't share ids.
   *
   * @default "mermaid"
   */
  prefix?: string | undefined;
  /**
   * Called when a diagram fails to render, with the `<pre>` that held it, the diagram, the error and the visitor's context. The node it returns replaces the `<pre>`; if it returns nothing, the `<pre>` is removed. Without it, a diagram that fails to render throws.
   */
  errorFallback?:
    | ((
        element: Element,
        diagram: string,
        error: unknown,
        ctx: HastVisitorContext
      ) => HastNode | null | undefined)
    | undefined;
}

/**
 * The plugin's definition: only the keys it defines, with a synchronous visitor, so `markdownToHtml` returns its result directly.
 */
export interface MermaidPelePlugin {
  name: string;
  options: { position: boolean };
  element: {
    filter: string[];
    visit: (...args: Parameters<ElementVisitor["visit"]>) => void;
  };
}

/**
 * Sätteri plugin that renders ` ```mermaid ` fences to inline SVG with Pele, in place of the code block, as a `raw` node, so its markup reaches the HTML exactly as Pele wrote it. Attributes on the fence (`{#id .class}`, with the `attributes` feature) go on the `<svg>`. Theme the diagrams with Pele's CSS variables (`--pele-bg`, `--pele-fg`, …); `mermaid-pele.css` adds a dark scheme. A factory, so each document's id prefixes start fresh. The id prefixes, attributes and errors are shared with the markdown-it and rehype plugins through `@mirrordown/core`.
 */
export const satteriMermaidPele = (
  options: SatteriMermaidPeleOptions = {}
): ((ctx: PluginFactoryContext) => MermaidPelePlugin) => {
  const { prefix = `mermaid`, errorFallback, ...pele } = options;
  return () => {
    const idPrefix = mermaidIdPrefixes(prefix);
    return defineHastPlugin({
      name: `mermaid-pele`,
      // Positions locate a diagram that fails to render.
      options: { position: true },
      element: {
        filter: [`pre`],
        visit(node, ctx) {
          const diagram = mermaidDiagram(node);
          if (!diagram) return;
          const { source, element } = diagram;
          let replacement: HastNode | null | undefined;
          try {
            replacement = {
              type: `raw`,
              value: mermaidSvg(
                render(source, { ...pele, idPrefix: idPrefix(source) }).svg,
                hastAttributes(element.properties)
              )
            };
          } catch (error) {
            if (!errorFallback)
              throw mermaidFailure(error, node.position?.start.line);
            replacement = errorFallback(node, source, error, ctx);
          }
          if (replacement) ctx.replaceNode(node, replacement);
          else ctx.removeNode(node);
        }
      }
    });
  };
};
