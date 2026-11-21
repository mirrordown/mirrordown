import {
  createAttributeReader,
  createDelimitedTransform,
  createHighlightMarkers,
  scanSpans,
  type MarkOptions
} from "@mirrordown/core";
import {
  defineMdastPlugin,
  markdownToMdast,
  type MdastPluginInstance,
  type MdastTarget,
  type PluginFactoryContext
} from "satteri";

export type { MarkOptions };

type TextVisitor = NonNullable<MdastPluginInstance["text"]>;

/**
 * The plugin's definition: only the keys it defines, with a synchronous visitor, so `markdownToHtml` returns its result directly.
 */
export interface MarkPlugin {
  name: string;
  options: { position: boolean };
  text: (...args: Parameters<TextVisitor>) => void;
}

/**
 * Sätteri plugin for highlight syntax (`==text==`), wrapping each match in a custom `mark` node that renders as a `<mark>` element. A highlight that starts with a marker emoji names a variant in `data-highlight`: a colour emoji is removed (`==🔴text==` renders `<mark data-highlight="red">text</mark>`), a label's is kept (`==🐛 Bug==` renders `<mark data-highlight="bug">🐛 Bug</mark>`). `options.markers` adds, renames and turns off markers. The scan is shared with the remark plugin and markdown-it's pairing rules through `@mirrordown/core`; it runs once per parent, the first time one of the parent's text nodes is visited.
 */
export const satteriMark = (
  options: MarkOptions = {}
): ((ctx: PluginFactoryContext) => MarkPlugin) => {
  // Once per plugin, not per document, so a bad option throws where the plugin is created.
  const markers = createHighlightMarkers(options);
  return ({ source, features }) => {
    // Sätteri reads attribute blocks before plugins run, when the document's features turn them on: a block written right after a span is then the span's to take.
    const read =
      features.attributes === true
        ? createAttributeReader(markdownToMdast)
        : undefined;
    const transform = createDelimitedTransform<MdastTarget>(`=`, {
      text: (value) => ({ type: `text`, value }),
      wrap: (children) => {
        // Under the key Sätteri's attribute blocks write, so a `data-highlight` in one replaces it.
        const variant = markers.take(children);
        return {
          type: `mark`,
          data: variant
            ? { hName: `mark`, hProperties: { "data-highlight": variant } }
            : { hName: `mark` },
          children
        };
      }
    });
    const seen = new WeakSet<object>();
    return defineMdastPlugin({
      name: `mark`,
      // Positions let the scan tell escaped markers (`\==`) from real ones.
      options: { position: true },
      text(node, ctx) {
        if (!node.value.includes(`==`)) return;
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
};
