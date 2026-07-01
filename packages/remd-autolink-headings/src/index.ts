import { SKIP, visit } from "unist-util-visit";
import type { Element, ElementContent, Parents, Properties, Root } from "hast";
import type { Plugin } from "unified";
import type { VisitorResult } from "unist-util-visit";

/** A static value, or a function that builds it from the heading element. */
type Build<T> = T | ((element: Element) => T);

/** Link content: a node, a list of nodes, or a builder for either. */
type Content = Build<ElementContent | ElementContent[]>;

/** Which headings to autolink: a tag name, a list of them, or a predicate. */
export type HeadingTest =
  | string
  | string[]
  | ((
      element: Element,
      index: number | undefined,
      parent: Parents | undefined
    ) => boolean | undefined);

export interface AutolinkHeadingsOptions {
  /** Where to place the link relative to the heading (default: `"prepend"`). */
  behavior?: "prepend" | "append" | "wrap" | "before" | "after";
  /** Content of the link (default: empty — a marker is drawn via the CSS). */
  content?: Content;
  /** Wrapper element placed around heading + link for `before`/`after`. */
  group?: Build<ElementContent>;
  /** Extra properties to set on the heading element itself. */
  headingProperties?: Build<Properties>;
  /** Properties to set on the link element. */
  properties?: Build<Properties>;
  /** Which headings to process (default: all `h1`–`h6` that carry an `id`). */
  test?: HeadingTest;
}

// Inlined from hast-util-heading-rank: maps `h1`–`h6` to `1`–`6`, else
// `undefined`.
const headingRank = (node: Element): number | undefined => {
  const name = node.tagName.toLowerCase();
  const code =
    name.length === 2 && name.charCodeAt(0) === 104 /* h */
      ? name.charCodeAt(1)
      : 0;
  return code > 48 && code < 55 /* 1–6 */ ? code - 48 : undefined;
};

// Inlined subset of hast-util-is-element's `convertElement`: turn a test into a
// predicate over (element, index, parent).
const convertTest = (
  test: HeadingTest | undefined
): ((
  element: Element,
  index: number | undefined,
  parent: Parents | undefined
) => boolean) => {
  if (test === undefined) return () => true;
  if (typeof test === "string") return (element) => element.tagName === test;
  if (typeof test === "function") {
    return (element, index, parent) => Boolean(test(element, index, parent));
  }
  const names = test;
  return (element) => names.includes(element.tagName);
};

const toProperties = (
  value: Build<Properties> | undefined,
  node: Element
): Properties => {
  if (typeof value === "function") return value(node);
  return value ? structuredClone(value) : {};
};

const toNodes = (
  value: Content | undefined,
  node: Element
): ElementContent[] => {
  if (value === undefined) return [];
  const result =
    typeof value === "function" ? value(node) : structuredClone(value);
  return Array.isArray(result) ? result : [result];
};

const createLink = (
  node: Element,
  properties: Properties,
  children: ElementContent[]
): Element => ({
  type: "element",
  tagName: "a",
  properties: { ...properties, href: `#${String(node.properties.id)}` },
  children
});

/**
 * rehype plugin that adds a self-referential link to every heading that has an
 * `id` (pair it after `@mirrordown/remd-slug` or markdown-it-attrs).
 *
 * By default the link is prepended, empty, and carries `class="anchor"` — the
 * shipped stylesheet draws a `#` marker on hover via `::before`, so no extra
 * element is emitted. Pass `content`/`properties`/`behavior` to customize; see
 * {@link AutolinkHeadingsOptions}.
 */
export const rehypeAutolinkHeadings: Plugin<
  [AutolinkHeadingsOptions?],
  Root
> = (options) => {
  const settings = options ?? {};
  const behavior = settings.behavior ?? "prepend";
  const content = settings.content;
  const group = settings.group;
  const headingProperties = settings.headingProperties;
  const is = convertTest(settings.test);
  const inject = behavior === "prepend" || behavior === "append";

  // Default link properties: always the `anchor` class (the CSS hook). The
  // inject behaviors also get aria-hidden + tabindex, since the link sits
  // beside the visible heading text rather than wrapping it.
  const properties: Build<Properties> =
    settings.properties ??
    (inject
      ? { className: ["anchor"], ariaHidden: "true", tabIndex: -1 }
      : { className: ["anchor"] });

  const wrap = (node: Element): VisitorResult => {
    const isFn = typeof content === "function";
    const before: ElementContent[] = isFn ? [] : node.children;
    const after = toNodes(content, node);
    node.children = [
      createLink(node, toProperties(properties, node), [...before, ...after])
    ];
    return SKIP;
  };

  const around = (
    node: Element,
    index: number,
    parent: Parents
  ): VisitorResult => {
    const link = createLink(
      node,
      toProperties(properties, node),
      toNodes(content, node)
    );
    let nodes: ElementContent[] =
      behavior === "before" ? [link, node] : [node, link];
    if (group) {
      const grouping =
        typeof group === "function" ? group(node) : structuredClone(group);
      if (grouping.type === "element") {
        grouping.children = nodes;
        nodes = [grouping];
      }
    }
    parent.children.splice(index, 1, ...nodes);
    return [SKIP, index + nodes.length];
  };

  const injectLink = (node: Element): VisitorResult => {
    const link = createLink(
      node,
      toProperties(properties, node),
      toNodes(content, node)
    );
    if (behavior === "prepend") node.children.unshift(link);
    else node.children.push(link);
    return SKIP;
  };

  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (
        headingRank(node) === undefined ||
        !node.properties.id ||
        !is(node, index ?? undefined, parent ?? undefined)
      ) {
        return undefined;
      }

      if (headingProperties) {
        Object.assign(node.properties, toProperties(headingProperties, node));
      }

      if (behavior === "wrap") return wrap(node);
      if (
        (behavior === "before" || behavior === "after") &&
        typeof index === "number" &&
        parent
      ) {
        return around(node, index, parent);
      }
      return injectLink(node);
    });
  };
};
