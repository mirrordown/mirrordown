import type { Plugin, Transformer } from "unified";
import type { Data, Parent, PhrasingContent, Root, RootContent } from "mdast";
import {
  tagChildren,
  tagHref,
  textEscapes,
  type TagsOptions
} from "@mirrordown/core";

export type { TagsOptions };

/** The data that renders a {@link Tag} node as its link. */
export interface TagData extends Data {
  hName: `a`;
  hProperties: { className: string[]; href: string };
}

/** An mdast node for a tag (`#tag`), rendered as `<a class="tag" href="#tag">`. Its child is the tag's text, `#` included. */
export interface Tag extends Parent {
  type: `tag`;
  children: PhrasingContent[];
  data: TagData;
}

/**
 * remark plugin for tags (`#tag`), rendering each as `<a class="tag" href="#tag">#tag</a>`. What a tag is and where one may start are shared with the markdown-it and Sätteri plugins through `@mirrordown/core`. List it after `remarkAttrs`, so an attribute block (`{#id}`) is read before the tags in it, and after the plugins whose spans a tag can open (mark, del, ins, kbd and the rest).
 */
export const remarkTags: Plugin<[TagsOptions?], Root> = (options) => {
  const href = tagHref(options);
  const transformer: Transformer<Root> = (tree, file) => {
    // Escapes are resolved before this runs: the source tells `\#tag` from `#tag`.
    const source = String(file);
    const walk = (node: Parent, inTableCell: boolean): void => {
      const inCell = inTableCell || node.type === `tableCell`;
      const children = tagChildren<RootContent>(
        node.children,
        (text) =>
          textEscapes(
            text,
            source,
            node.type,
            node.children.length === 1,
            inCell
          ),
        {
          text: (value) => ({ type: `text`, value }),
          tag: (name, target): Tag => ({
            type: `tag`,
            children: [{ type: `text`, value: `#${name}` }],
            data: {
              hName: `a`,
              hProperties: { className: [`tag`], href: target }
            }
          })
        },
        href
      );
      if (children) node.children = children;
      for (const child of node.children) {
        // A link's text is the link's: a tag is never read in it. A tag's own text is done.
        if (
          `children` in child &&
          child.type !== `link` &&
          child.type !== `linkReference` &&
          child.type !== `tag`
        )
          walk(child, inCell);
      }
    };
    walk(tree, false);
  };

  return transformer;
};
