import {
  createTagCollector,
  tagAncestors,
  tagChildren,
  tagHref,
  tagKey,
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
export { tagAncestors, tagKey };

type TextVisitor = NonNullable<MdastPluginInstance["text"]>;
type Context = Parameters<TextVisitor>[1];
type Hook = NonNullable<MdastPluginInstance["after"]>;

/**
 * The plugin's definition: only the keys it defines, with synchronous visitors, so `markdownToHtml` returns its result directly.
 */
export interface TagsPlugin {
  name: string;
  options: { position: boolean };
  text: (...args: Parameters<TextVisitor>) => void;
  after: (...args: Parameters<Hook>) => void;
}

// Orders two places in the tree (see `made` below) as the document does.
const byPlace = (a: readonly number[], b: readonly number[]): number => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0);
    if (difference !== 0) return difference;
  }
  return a.length - b.length;
};

/**
 * Sätteri plugin for tags (`#tag`), rendering each as `<a class="tag" href="#tag">#tag</a>`. What a tag is and where one may start are shared with the markdown-it and remark plugins through `@mirrordown/core`. A parent's children are read together, the first time one of its text nodes holding a `#` is visited, as markdown-it reads a run of text tokens. List it after the plugins whose spans a tag can open (mark, del, ins, kbd and the rest). The document's tags, in the order they first appear, are in `ctx.data.tags` (the result's `data.tags`); under Astro they are also merged into the frontmatter's `tags`.
 */
export const satteriTags =
  (options: TagsOptions = {}): ((ctx: PluginFactoryContext) => TagsPlugin) =>
  ({ source }) => {
    const href = tagHref(options);
    const seen = new WeakSet<object>();
    // Each tag made, with its place in the tree: the indices from the root down to its parent, then the index its run of text starts at and its place in the run. The order tags are made in is not the document's (a parent's tags are made before those of the elements inside it, so `#a *#b* #c` makes `c` before `b`), and source offsets can't give it either, since a span plugin listed before this one rebuilds text nodes without positions. Sätteri applies a plugin's changes after the walk, so the indices read during it are those of the tree as it was, the same for every tag.
    const made: Array<{ place: number[]; name: string }> = [];
    // The indices from the root down to `node`.
    const place = (node: MdastTarget, ctx: Context): number[] => {
      const indices: number[] = [];
      for (
        let current: MdastTarget | undefined = node;
        current;
        current = ctx.parent(current)
      ) {
        const index = ctx.indexOf(current);
        if (index === undefined) break;
        indices.push(index);
      }
      return indices.reverse();
    };
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
        const siblings = parent.children;
        const names = new Map<object, string>();
        const children = tagChildren<MdastTarget>(
          siblings,
          (text) =>
            textEscapes(
              text,
              source,
              parent.type,
              siblings.length === 1,
              inTableCell
            ),
          {
            text: (value) => ({ type: `text`, value }),
            tag: (name, target) => {
              const tag = {
                type: `tag`,
                data: {
                  hName: `a`,
                  hProperties: { className: [`tag`], href: target }
                },
                children: [{ type: `text`, value: `#${name}` }]
              };
              names.set(tag, name);
              return tag;
            }
          },
          href
        );
        if (!children) return;
        const base = place(parent, ctx);
        const kept = new Map<object, number>(
          siblings.map((child, index) => [child, index])
        );
        // The run of text a tag is in starts just after the last node kept as it was, which is not text, since a run takes every text node between two other nodes. So a run's index is never an element's, under which the element's own tags have their places.
        let run = 0;
        let order = 0;
        for (const child of children) {
          const index = kept.get(child);
          if (index !== undefined) {
            run = index + 1;
            order = 0;
            continue;
          }
          const name = names.get(child);
          if (name !== undefined)
            made.push({ place: [...base, run, order++], name });
        }
        ctx.setProperty(parent, `children`, children);
      },
      after(_root, ctx) {
        const astro = ctx.data.astro;
        const collector = createTagCollector(
          typeof astro === `object` && astro !== null && `frontmatter` in astro
            ? astro.frontmatter
            : undefined
        );
        ctx.data.tags = collector.tags;
        made
          .sort((a, b) => byPlace(a.place, b.place))
          .forEach(({ name }, at) => collector.add(name, at));
      }
    });
  };
