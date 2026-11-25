// This plugin hands Sätteri's nodes to core's mdast transform and back; the type assertions bridging Sätteri's `MdastTarget` and core's node shape are reviewed and intentional, as in sat-caption.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import { removeCjkBreaks, type CjkBreakNode } from "@mirrordown/core";
import type { Text } from "mdast";
import {
  defineMdastPlugin,
  type MdastPluginInstance,
  type MdastTarget,
  type PluginFactoryContext
} from "satteri";

type BeforeHook = NonNullable<MdastPluginInstance["before"]>;

/**
 * The plugin's definition: only the keys it defines, with a synchronous hook, so `markdownToHtml` returns its result directly.
 */
export interface CjkBreaksPlugin {
  name: string;
  options: { position: boolean };
  before: (...args: Parameters<BeforeHook>) => void;
}

/**
 * Sätteri plugin that removes a soft line break between two Chinese or Japanese characters, where the browser would show it as a space: both characters East Asian Width W, F or H and neither Hangul, or either one the zero-width space U+200B. The character on each side is the one the reader sees next to the break, read through emphasis, links and the Mirrordown spans; a code span counts by its own content. Hard breaks are never touched. List it after every other mdast plugin: several find their syntax by the lines of a text node (tabs, steps, alerts, tags, caption and others), and a removed break is a line they no longer see. The rule is shared with the markdown-it and remark plugins through `@mirrordown/core`.
 */
export const satteriCjkBreaks =
  (): ((ctx: PluginFactoryContext) => CjkBreaksPlugin) =>
  ({ source }) =>
    defineMdastPlugin({
      name: `cjk-breaks`,
      // Positions let a rebuilt text node keep a record of the characters that were escaped, for the plugins after it.
      options: { position: true },
      before(root, ctx) {
        removeCjkBreaks(root as unknown as CjkBreakNode, source, {
          text: (node, value, data) => {
            const text = node as unknown as Text;
            ctx.setField(text, `value`, value);
            if (data !== node.data)
              ctx.setField(
                text,
                `data`,
                (data ?? null) as Record<string, unknown> | null
              );
          },
          children: (parent, children) => {
            ctx.setField(
              parent as unknown as MdastTarget,
              `children`,
              children as unknown as MdastTarget[]
            );
          }
        });
      }
    });
