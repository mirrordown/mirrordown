import {
  tagChildren,
  tagHref,
  textEscapes,
  type TagsOptions
} from "@mirrordown/core";
import {
  defineMdastPlugin,
  type MdastPluginInstance,
  type MdastTarget,
  type PluginFactoryContext
} from "satteri";

export type { TagsOptions };

type TextVisitor = NonNullable<MdastPluginInstance["text"]>;
type Context = Parameters<TextVisitor>[1];

/**
 * The plugin's definition: only the keys it defines, with a synchronous visitor, so `markdownToHtml` returns its result directly.
 */
export interface TagsPlugin {
  name: string;
  options: { position: boolean };
  text: (...args: Parameters<TextVisitor>) => void;
}

/**
 * Sätteri plugin for tags (`#tag`), rendering each as `<a class="tag" href="#tag">#tag</a>`. What a tag is and where one may start are shared with the markdown-it and remark plugins through `@mirrordown/core`. A parent's children are read together, the first time one of its text nodes holding a `#` is visited, as markdown-it reads a run of text tokens. List it after the plugins whose spans a tag can open (mark, del, ins, kbd and the rest).
 */
export const satteriTags =
  (options: TagsOptions = {}): ((ctx: PluginFactoryContext) => TagsPlugin) =>
  ({ source }) => {
    const href = tagHref(options);
    const seen = new WeakSet<object>();
    // Whether `node` is inside a link, whose text is the link's (a tag is never read in it), and whether it is inside a table cell, where `\|` is the table's and not an escape.
    const context = (
      node: MdastTarget,
      ctx: Context
    ): { inLink: boolean; inTableCell: boolean } => {
      let inTableCell = false;
      for (
        let ancestor = ctx.parent(node);
        ancestor;
        ancestor = ctx.parent(ancestor)
      ) {
        if (ancestor.type === `link` || ancestor.type === `linkReference`)
          return { inLink: true, inTableCell };
        inTableCell ||= ancestor.type === `tableCell`;
      }
      return { inLink: false, inTableCell };
    };
    return defineMdastPlugin({
      name: `tags`,
      // Positions let the scan tell an escaped `\#` from a real one.
      options: { position: true },
      text(node, ctx) {
        if (!node.value.includes(`#`)) return;
        const parent = ctx.parent(node);
        if (seen.has(parent)) return;
        seen.add(parent);
        const { inLink, inTableCell } = context(node, ctx);
        if (inLink) return;
        const children = tagChildren<MdastTarget>(
          parent.children,
          (text) =>
            textEscapes(
              text,
              source,
              parent.type,
              parent.children.length === 1,
              inTableCell
            ),
          {
            text: (value) => ({ type: `text`, value }),
            tag: (name, target) => ({
              type: `tag`,
              data: {
                hName: `a`,
                hProperties: { className: [`tag`], href: target }
              },
              children: [{ type: `text`, value: `#${name}` }]
            })
          },
          href
        );
        if (children) ctx.setProperty(parent, `children`, children);
      }
    });
  };
