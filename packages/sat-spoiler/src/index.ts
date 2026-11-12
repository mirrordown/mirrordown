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
export interface SpoilerPlugin {
  name: string;
  options: { position: boolean };
  text: (...args: Parameters<TextVisitor>) => void;
}

/**
 * Sätteri plugin for Discord-style spoiler syntax (`||text||`), rendering a JavaScript-free click-to-reveal spoiler: a `<label>` wrapping a visually-hidden checkbox and the content `<span>`, which CSS reveals when the box is checked. The scan is shared with the remark plugin and markdown-it's pairing rules through `@mirrordown/core`, and the output is byte-identical to `@mirrordown/mdit-spoiler`.
 */
export const satteriSpoiler =
  (): ((ctx: PluginFactoryContext) => SpoilerPlugin) =>
  ({ source, features }) => {
    // Sätteri reads attribute blocks before plugins run, when the document's features turn them on: a block written right after a span is then the span's to take.
    const read =
      features.attributes === true
        ? createAttributeReader(markdownToMdast)
        : undefined;
    const transform = createDelimitedTransform<MdastTarget>(`|`, {
      text: (value) => ({ type: `text`, value }),
      // Sätteri has no hast handler hook, so the label, checkbox and span are custom nodes rendering through `hName`. The checkbox precedes the span so CSS's `:checked ~ .content` combinator reaches it.
      // A block written right after a spoiler is read and dropped, as in the other engines, whose renderers build the label without the attributes their attrs plugins leave on the spoiler.
      attributes: () => {},
      wrap: (children) => ({
        type: `spoiler`,
        data: {
          hName: `label`,
          hProperties: { className: [`markdown-spoiler`] }
        },
        children: [
          {
            type: `spoilerToggle`,
            data: {
              hName: `input`,
              hProperties: {
                type: `checkbox`,
                className: [`markdown-spoiler-toggle`],
                ariaLabel: `spoiler`
              }
            }
          },
          {
            type: `spoilerContent`,
            data: {
              hName: `span`,
              hProperties: { className: [`markdown-spoiler-content`] }
            },
            children
          }
        ]
      })
    });
    const seen = new WeakSet<object>();
    return defineMdastPlugin({
      name: `spoiler`,
      // Positions let the scan tell escaped markers (`\||`) from real ones.
      options: { position: true },
      text(node, ctx) {
        if (!node.value.includes(`||`)) return;
        const parent = ctx.parent(node);
        if (seen.has(parent)) return;
        seen.add(parent);
        // In a table cell `\|` is the table's way to write a pipe, the only way to write a spoiler there, and not an escape: `scanSpans` looks for the cell however far up it is (`| *\|\|x\|\|* |`).
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
