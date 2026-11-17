import {
  createAttributeReader,
  createDelimitedTransform,
  scanSpans
} from "@mirrordown/core";
import {
  defineMdastPlugin,
  markdownToMdast,
  type MdastPluginInstance,
  type MdastTarget,
  type PluginFactoryContext
} from "satteri";

type TextVisitor = NonNullable<MdastPluginInstance["text"]>;

/**
 * The plugin's definition: only the keys it defines, with a synchronous visitor, so `markdownToHtml` returns its result directly.
 */
export interface InsPlugin {
  name: string;
  options: { position: boolean };
  text: (...args: Parameters<TextVisitor>) => void;
}

/**
 * Sätteri plugin for insertion syntax (`++text++`), wrapping each match in a custom `insert` node that renders as an `<ins>` element. The scan is shared with the remark plugin and markdown-it's pairing rules through `@mirrordown/core`; it runs once per parent, the first time one of the parent's text nodes is visited.
 */
export const satteriIns =
  (): ((ctx: PluginFactoryContext) => InsPlugin) =>
  ({ source, features }) => {
    // Sätteri reads attribute blocks before plugins run, when the document's features turn them on: a block written right after a span is then the span's to take.
    const read =
      features.attributes === true
        ? createAttributeReader(markdownToMdast)
        : undefined;
    const transform = createDelimitedTransform<MdastTarget>(`+`, {
      text: (value) => ({ type: `text`, value }),
      wrap: (children) => ({ type: `insert`, data: { hName: `ins` }, children })
    });
    const seen = new WeakSet<object>();
    return defineMdastPlugin({
      name: `ins`,
      // Positions let the scan tell escaped markers (`\++`) from real ones.
      options: { position: true },
      text(node, ctx) {
        if (!node.value.includes(`++`)) return;
        const parent = ctx.parent(node);
        if (seen.has(parent)) return;
        seen.add(parent);
        scanSpans(transform, parent, {
          source,
          read,
          parent: (of) => ctx.parent(of),
          setChildren: (of, children) => {
            ctx.setProperty(of, `children`, children);
          },
          setData: (of, data) => {
            ctx.setProperty(of, `data`, data);
          }
        });
      }
    });
  };
