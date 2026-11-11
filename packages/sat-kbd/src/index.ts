import { createKbdTransform } from "@mirrordown/core";
import {
  defineMdastPlugin,
  type MdastPluginInstance,
  type MdastTarget,
  type PluginFactoryContext
} from "satteri";

type TextVisitor = NonNullable<MdastPluginInstance["text"]>;
type LinkVisitor = NonNullable<MdastPluginInstance["link"]>;
type LinkReferenceVisitor = NonNullable<MdastPluginInstance["linkReference"]>;

/**
 * The plugin's definition: only the keys it defines, with a synchronous visitor, so `markdownToHtml` returns its result directly.
 */
export interface KbdPlugin {
  name: string;
  options: { position: boolean };
  text: (...args: Parameters<TextVisitor>) => void;
  link: (...args: Parameters<LinkVisitor>) => void;
  linkReference: (...args: Parameters<LinkReferenceVisitor>) => void;
}

/**
 * Sätteri plugin for keyboard-key syntax (`[[Ctrl]]`), wrapping each key in a custom `kbd` node that renders as a `<kbd>` element. The scan is shared with the remark plugin and markdown-it-kbd's rules through `@mirrordown/core`; it runs once per parent, the first time one of the parent's text nodes is visited.
 */
export const satteriKbd =
  (): ((ctx: PluginFactoryContext) => KbdPlugin) =>
  ({ source }) => {
    const transform = createKbdTransform<MdastTarget>(
      {
        text: (value) => ({ type: `text`, value }),
        wrap: (children) => ({ type: `kbd`, data: { hName: `kbd` }, children })
      },
      source,
      true
    );
    const seen = new WeakSet<object>();
    const scan = (node: MdastTarget, ctx: Parameters<TextVisitor>[1]): void => {
      const parent = ctx.parent(node);
      if (!parent || seen.has(parent)) return;
      seen.add(parent);
      const children = transform.withSource(
        parent.children,
        parent.type,
        source
      );
      if (children) ctx.setProperty(parent, `children`, children);
    };
    // A link's brackets can be a key's (`[[a]](b)`, or `[[a]]` beside a definition of `a`): its parent is scanned when the link's opening bracket is half of a `[[`.
    const scanLink = (
      node: MdastTarget,
      ctx: Parameters<TextVisitor>[1]
    ): void => {
      const start = node.position?.start.offset;
      if (start === undefined) return;
      if (source.startsWith(`[[`, start) || source.startsWith(`[[`, start - 1))
        scan(node, ctx);
    };
    return defineMdastPlugin({
      name: `kbd`,
      // Positions let the scan tell escaped markers (`\[[`) from real ones.
      options: { position: true },
      text(node, ctx) {
        if (node.value.includes(`[[`)) scan(node, ctx);
      },
      link: scanLink,
      linkReference: scanLink
    });
  };
