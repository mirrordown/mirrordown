import { createDelimitedTransform } from "@mirrordown/core";
import {
  defineMdastPlugin,
  type MdastPluginInstance,
  type MdastTarget,
  type PluginFactoryContext
} from "satteri";

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
 * Sätteri plugin for highlight syntax (`==text==`), wrapping each match in a custom `mark` node that renders as a `<mark>` element. The scan is shared with the remark plugin and markdown-it's pairing rules through `@mirrordown/core`; it runs once per parent, the first time one of the parent's text nodes is visited.
 */
export const satteriMark =
  (): ((ctx: PluginFactoryContext) => MarkPlugin) =>
  ({ source }) => {
    const transform = createDelimitedTransform<MdastTarget>(`=`, {
      text: (value) => ({ type: `text`, value }),
      wrap: (children) => ({ type: `mark`, data: { hName: `mark` }, children })
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
        const children = transform.withSource(
          parent.children,
          parent.type,
          source
        );
        if (children) ctx.setProperty(parent, `children`, children);
      }
    });
  };
