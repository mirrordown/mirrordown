import type { Plugin, Transformer } from "unified";
import type { Data, Parent, PhrasingContent, Root, RootContent } from "mdast";
import {
  createTagCollector,
  tagAncestors,
  tagChildren,
  tagHref,
  tagKey,
  textEscapes,
  type TagsOptions
} from "@mirrordown/core";

export type { TagsOptions };
export { tagAncestors, tagKey };

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
 * remark plugin for tags (`#tag`), rendering each as `<a class="tag" href="#tag">#tag</a>`. What a tag is and where one may start are shared with the markdown-it and Sätteri plugins through `@mirrordown/core`. List it after `remarkAttrs`, so an attribute block (`{#id}`) is read before the tags in it, and after the plugins whose spans a tag can open (mark, del, ins, kbd and the rest). The document's tags, in the order they first appear, are in `file.data.tags`; under Astro they are also merged into the frontmatter's `tags`.
 */
export const remarkTags: Plugin<[TagsOptions?], Root> = (options) => {
  const href = tagHref(options);
  const transformer: Transformer<Root> = (tree, file) => {
    const astro = file.data.astro;
    const collector = createTagCollector(
      typeof astro === `object` && astro !== null && `frontmatter` in astro
        ? astro.frontmatter
        : undefined
    );
    file.data.tags = collector.tags;
    // A count of the tags met so far. The walk meets them in document order, which their source offsets can't give: a span plugin listed before this one (mark, del, kbd…) rebuilds a paragraph's text nodes without positions.
    let count = 0;
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
        if (child.type === `tag`) {
          const [text] = child.children;
          if (text?.type === `text`)
            collector.add(text.value.slice(1), count++);
          continue;
        }
        // A link's text is the link's: a tag is never read in it.
        if (
          `children` in child &&
          child.type !== `link` &&
          child.type !== `linkReference`
        )
          walk(child, inCell);
      }
    };
    walk(tree, false);
  };

  return transformer;
};
