import { createKbdTransform } from "@mirrordown/core";
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
export interface KbdPlugin {
  name: string;
  options: { position: boolean };
  text: (...args: Parameters<TextVisitor>) => void;
}

/**
 * Sätteri plugin for keyboard-key syntax (`[[Ctrl]]`), wrapping each key in a custom `kbd` node that renders as a `<kbd>` element. The scan is shared with the remark plugin and markdown-it-kbd's rules through `@mirrordown/core`; it runs once per parent, the first time one of the parent's text nodes is visited.
 */
export const satteriKbd =
  (): ((ctx: PluginFactoryContext) => KbdPlugin) =>
  ({ source }) => {
    const transform = createKbdTransform<MdastTarget>({
      text: (value) => ({ type: `text`, value }),
      wrap: (children) => ({ type: `kbd`, data: { hName: `kbd` }, children })
    });
    const seen = new WeakSet<object>();
    return defineMdastPlugin({
      name: `kbd`,
      // Positions let the scan tell escaped markers (`\[[`) from real ones.
      options: { position: true },
      text(node, ctx) {
        if (!node.value.includes(`[[`)) return;
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
