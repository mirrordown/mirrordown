import type { Element, ElementContent, Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";
import { render, type RenderOptions } from "pele";
import {
  hastAttributes,
  mermaidDiagram,
  mermaidFailure,
  mermaidIdPrefixes,
  mermaidSvg
} from "@mirrordown/core";

/** Options for {@link rehypeMermaidPele}: Pele's render options, besides the id prefix, which is set per diagram. */
export interface RehypeMermaidPeleOptions extends Omit<
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
   * Called when a diagram fails to render, with the element that held it, the diagram, the error and the file, as in rehype-mermaid. The node it returns replaces the element; if it returns nothing, the element is removed. Without it, a diagram that fails to render fails the file.
   */
  errorFallback?:
    | ((
        element: Element,
        diagram: string,
        error: unknown,
        file: VFile
      ) => ElementContent | null | undefined)
    | undefined;
}

// Turn the <pre> into a raw node in place, keeping its position, as remd-inline-svg does: the SVG reaches the HTML byte-for-byte (as in mdit-mermaid-pele) instead of being re-serialized, and hast's types have no `raw` node without mdast-util-to-hast's augmentation.
const toRaw = (pre: Element, value: string): void => {
  const node: {
    type: string;
    tagName?: string;
    properties?: unknown;
    children?: unknown;
    value?: string;
  } = pre;
  delete node.tagName;
  delete node.properties;
  delete node.children;
  node.type = `raw`;
  node.value = value;
};

/**
 * rehype plugin that renders mermaid diagrams to inline SVG with Pele, as rehype-mermaid finds them: a `<pre>` holding only a `<code class="language-mermaid">` (a ` ```mermaid ` fence), or a `<pre class="mermaid">`. The `<svg>` replaces the `<pre>`, as a `raw` node, so its markup reaches the HTML exactly as Pele wrote it (stringify with `allowDangerousHtml`); attributes on the fence (`{#id .class}`, with remark-attrs) go on it. Theme the diagrams with Pele's CSS variables (`--pele-bg`, `--pele-fg`, …); `mermaid-pele.css` adds a dark scheme. The id prefixes, attributes and errors are shared with the markdown-it and Sätteri plugins through `@mirrordown/core`.
 */
export const rehypeMermaidPele: Plugin<[RehypeMermaidPeleOptions?], Root> = (
  options = {}
) => {
  const { prefix = `mermaid`, errorFallback, ...pele } = options;
  return (tree, file) => {
    const idPrefix = mermaidIdPrefixes(prefix);
    visit(tree, `element`, (node, index, parent) => {
      if (parent === undefined || index === undefined) return;
      const diagram = mermaidDiagram(node);
      if (!diagram) return;
      const { source, element } = diagram;
      let svg: string;
      try {
        svg = mermaidSvg(
          render(source, { ...pele, idPrefix: idPrefix(source) }).svg,
          hastAttributes(element.properties)
        );
      } catch (error) {
        if (!errorFallback) {
          const failure = mermaidFailure(error, node.position?.start.line);
          return file.fail(failure.message, {
            ancestors: [node],
            cause: failure.cause instanceof Error ? failure.cause : null,
            place: node.position ?? null,
            ruleId: `mermaid-pele`,
            source: `@mirrordown/remd-mermaid-pele`
          });
        }
        const replacement = errorFallback(node, source, error, file);
        if (replacement) {
          parent.children[index] = replacement;
          return index + 1;
        }
        parent.children.splice(index, 1);
        return index;
      }
      toRaw(node, svg);
      return index + 1;
    });
  };
};
