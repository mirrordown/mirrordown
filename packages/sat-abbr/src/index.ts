import {
  carryEscapes,
  createAbbreviationScan,
  parseAbbreviations,
  textEscapes
} from "@mirrordown/core";
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
  options: { position: boolean };
  before: (...args: Parameters<BeforeHook>) => void;
  text: (...args: Parameters<TextVisitor>) => void;
}

/**
 * Sätteri plugin for abbreviations: a paragraph of `*[term]: definition` lines defines them (and is removed), and each defined term elsewhere renders as `<abbr title="definition">`. The definition and term rules are shared with the remark plugin through `@mirrordown/core`, and follow the markdown-it plugin's.
 */
export const satteriAbbr =
  (): ((ctx: PluginFactoryContext) => AbbrPlugin) =>
  ({ source }) => {
    let scan: ReturnType<typeof createAbbreviationScan> | undefined;
    return defineMdastPlugin({
      name: `abbr`,
      // Positions give a definition paragraph its source, and let the pieces of a split text node keep which characters were escaped.
      options: { position: true },
      // Definitions can follow their uses, so they are all collected before any text is visited.
      before(root, ctx) {
        const abbreviations = new Map<string, string>();
        const walk = (node: MdastTarget): void => {
          if (!(`children` in node)) return;
          if (node.type === `paragraph`) {
            const [only] = node.children;
            const start = node.position?.start.offset;
            const end = node.position?.end.offset;
            // A definition is read from its source line, as markdown-it reads it, so inline syntax in a title does not make the line text. A paragraph another plugin built has no position: there its text is read.
            const definitions = parseAbbreviations(
              node.children.length === 1 &&
                only?.type === `text` &&
                typeof only.value === `string`
                ? only.value
                : undefined,
              start !== undefined && end !== undefined
                ? source.slice(start, end)
                : undefined
            );
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
        // The pieces have no source position, so each keeps a record of which of its characters were escaped: a span plugin that runs later still tells `\==` from `==`.
        const escaped = textEscapes(node, source);
        let offset = 0;
        ctx.replaceNode(
          node,
          parts.map((part): MdastTarget => {
            const text = {
              type: `text` as const,
              value: `text` in part ? part.text : part.term
            };
            carryEscapes(text, escaped, offset);
            offset += text.value.length;
            return `text` in part
              ? text
              : {
                  type: `abbr`,
                  data: { hName: `abbr`, hProperties: { title: part.title } },
                  children: [text]
                };
          })
        );
      }
    });
  };
