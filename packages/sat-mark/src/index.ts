import {
  MARK_DELIMITERS,
  createDelimitedTransform,
  escapedIndices,
  maskEscaped,
  unmaskEscaped
} from "@mirrordown/core";
import {
  defineMdastPlugin,
  type MdastPluginInstance,
  type MdastTarget,
  type PluginFactoryContext
} from "satteri";

type TextVisitor = NonNullable<MdastPluginInstance["text"]>;

/**
 * The plugin's definition: only the keys it defines, with a synchronous
 * visitor, so `markdownToHtml` returns its result directly.
 */
export interface MarkPlugin {
  name: string;
  options: { position: boolean };
  text: (...args: Parameters<TextVisitor>) => void;
}

/**
 * Sätteri plugin for highlight syntax (`==text==`), wrapping each match in a
 * custom `mark` node that renders as a `<mark>` element. The scan is shared
 * with the remark plugin through `@mirrordown/core`; it runs once per parent,
 * the first time one of the parent's text nodes is visited.
 */
export const satteriMark =
  (): ((ctx: PluginFactoryContext) => MarkPlugin) =>
  ({ source }) => {
    const transform = createDelimitedTransform<MdastTarget>(MARK_DELIMITERS, {
      text: (value) => ({ type: `text`, value }),
      wrap: (children) => ({
        type: `mark`,
        data: { hName: `mark` },
        children
      })
    });
    const seen = new WeakSet<object>();

    // Text values have their escapes resolved; mask escaped characters (found
    // by aligning with the source) so `\==` is not a delimiter, as in
    // markdown-it. Masked nodes are copies, so restoring them never touches
    // Sätteri's own nodes.
    const mask = (node: MdastTarget): MdastTarget => {
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (
        node.type !== `text` ||
        typeof node.value !== `string` ||
        start === undefined ||
        end === undefined
      )
        return node;
      const escaped = escapedIndices(node.value, source, start, end);
      return escaped.size === 0
        ? node
        : { type: `text`, value: maskEscaped(node.value, escaped) };
    };
    const restore = (nodes: readonly MdastTarget[]): void => {
      for (const node of nodes) {
        if (node.type === `text` && typeof node.value === `string`) {
          const value = unmaskEscaped(node.value);
          if (value !== node.value) node.value = value;
        } else if (transform.built(node) && `children` in node) {
          restore(node.children);
        }
      }
    };

    return defineMdastPlugin({
      name: `mark`,
      options: { position: true },
      text(node, ctx) {
        if (!node.value.includes(`==`)) return;
        const parent = ctx.parent(node);
        if (seen.has(parent)) return;
        seen.add(parent);
        const children = transform(parent.children.map(mask));
        if (!children.some((child) => transform.built(child))) return;
        restore(children);
        ctx.setProperty(parent, `children`, children);
      }
    });
  };
