import { createAbbreviationScan, parseAbbreviations } from "@mirrordown/core";
import {
  defineMdastPlugin,
  type MdastPluginInstance,
  type MdastTarget,
  type PluginFactoryContext
} from "satteri";

type TextVisitor = NonNullable<MdastPluginInstance["text"]>;
type BeforeHook = NonNullable<MdastPluginInstance["before"]>;

/**
 * The plugin's definition: only the keys it defines, with synchronous visitors, so `markdownToHtml` returns its result directly.
 */
export interface AbbrPlugin {
  name: string;
  before: (...args: Parameters<BeforeHook>) => void;
  text: (...args: Parameters<TextVisitor>) => void;
}

/**
 * Sätteri plugin for abbreviations: a paragraph of `*[term]: definition` lines defines them (and is removed), and each defined term elsewhere renders as `<abbr title="definition">`. The definition and term rules are shared with the markdown-it and remark plugins through `@mirrordown/core`.
 */
export const satteriAbbr =
  (): ((ctx: PluginFactoryContext) => AbbrPlugin) => () => {
    let scan: ReturnType<typeof createAbbreviationScan> | undefined;
    return defineMdastPlugin({
      name: `abbr`,
      // Definitions can follow their uses, so they are all collected before any text is visited.
      before(root, ctx) {
        const abbreviations = new Map<string, string>();
        const walk = (node: MdastTarget): void => {
          if (!(`children` in node)) return;
          if (node.type === `paragraph`) {
            const [only] = node.children;
            const definitions =
              node.children.length === 1 &&
              only?.type === `text` &&
              typeof only.value === `string`
                ? parseAbbreviations(only.value)
                : undefined;
            if (definitions) {
              // The first definition of a term wins.
              for (const [term, title] of definitions) {
                if (!abbreviations.has(term)) abbreviations.set(term, title);
              }
              ctx.removeNode(node);
            }
            return;
          }
          node.children.forEach(walk);
        };
        walk(root);
        scan =
          abbreviations.size > 0
            ? createAbbreviationScan(abbreviations)
            : undefined;
      },
      text(node, ctx) {
        const parts = scan?.(node.value);
        if (!parts) return;
        ctx.replaceNode(
          node,
          parts.map((part): MdastTarget =>
            `text` in part
              ? { type: `text`, value: part.text }
              : {
                  type: `abbr`,
                  data: { hName: `abbr`, hProperties: { title: part.title } },
                  children: [{ type: `text`, value: part.term }]
                }
          )
        );
      }
    });
  };
