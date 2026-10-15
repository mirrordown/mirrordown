import {
  defineHastPlugin,
  type HastVisitorInstance,
  type PluginFactoryContext
} from "satteri";

type ElementVisitor = Extract<
  NonNullable<HastVisitorInstance["element"]>,
  { filter: string[] }
>;
type Element = Parameters<ElementVisitor["visit"]>[0];
type ElementContent = Element["children"][number];
type Properties = Element["properties"];
type Parent = NonNullable<
  ReturnType<Parameters<ElementVisitor["visit"]>[1]["parent"]>
>;

/** A static value, or a function that builds it from the heading element. */
type Build<T> = T | ((element: Element) => T);

/** Which headings to autolink: a tag name, a list of them, or a predicate. */
export type HeadingTest =
  | string
  | string[]
  | ((
      element: Element,
      index: number | undefined,
      parent: Parent | undefined
    ) => boolean | undefined);

/** Options for {@link satteriAutolinkHeadings}, the same as `@mirrordown/remd-autolink-headings`'s. */
export interface AutolinkHeadingsOptions {
  /** Where to place the link relative to the heading (default: `"prepend"`). */
  behavior?: "prepend" | "append" | "wrap" | "before" | "after";
  /** Content of the link (default: empty — a marker is drawn via the CSS). */
  content?: Build<ElementContent | ElementContent[]>;
  /** Wrapper element placed around heading + link for `before`/`after`. */
  group?: Build<ElementContent>;
  /** Extra properties to set on the heading element itself. */
  headingProperties?: Build<Properties>;
  /** Properties to set on the link element. */
  properties?: Build<Properties>;
  /** Which headings to process (default: all `h1`–`h6` that carry an `id`). */
  test?: HeadingTest;
}

/**
 * The plugin's definition: only the keys it defines, with a synchronous visitor, so `markdownToHtml` returns its result directly.
 */
export interface AutolinkHeadingsPlugin {
  name: string;
  element: {
    filter: string[];
    visit: (...args: Parameters<ElementVisitor["visit"]>) => void;
  };
}

const build = <T>(value: Build<T>, element: Element): T =>
  typeof value === "function"
    ? // A Build<T> that is a function is the builder, never T itself here.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      (value as (element: Element) => T)(element)
    : structuredClone(value);

/**
 * Sätteri plugin that adds a self-referential link to every heading that has an `id` (list it after `@mirrordown/sat-slug`). By default the link is prepended, empty, and carries `class="anchor"`; the shipped stylesheet draws a `#` marker on hover. Options and output match `@mirrordown/remd-autolink-headings`; the option values are hast nodes, as Sätteri's own hast plugins use.
 */
export const satteriAutolinkHeadings =
  (
    options: AutolinkHeadingsOptions = {}
  ): ((ctx: PluginFactoryContext) => AutolinkHeadingsPlugin) =>
  () => {
    const {
      behavior = "prepend",
      content,
      group,
      headingProperties,
      test
    } = options;
    const inject = behavior === "prepend" || behavior === "append";
    // Default link properties: always the `anchor` class (the CSS hook). The inject behaviors also get aria-hidden + tabindex, since the link sits beside the visible heading text rather than wrapping it.
    const properties: Build<Properties> =
      options.properties ??
      (inject
        ? { className: ["anchor"], ariaHidden: "true", tabIndex: -1 }
        : { className: ["anchor"] });
    const is =
      test === undefined
        ? (): boolean => true
        : typeof test === "string"
          ? (element: Element): boolean => element.tagName === test
          : Array.isArray(test)
            ? (element: Element): boolean => test.includes(element.tagName)
            : (
                element: Element,
                index: number | undefined,
                parent: Parent | undefined
              ): boolean => Boolean(test(element, index, parent));
    const contentOf = (element: Element): ElementContent[] => {
      if (content === undefined) return [];
      const nodes = build(content, element);
      return Array.isArray(nodes) ? nodes : [nodes];
    };
    const link = (element: Element, children: ElementContent[]): Element => ({
      type: "element",
      tagName: "a",
      properties: {
        ...build(properties, element),
        href: `#${String(element.properties.id)}`
      },
      children
    });

    return defineHastPlugin({
      name: "autolink-headings",
      element: {
        filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
        visit(node, ctx) {
          // An empty id (a heading with no text) has nothing to link to.
          if (!node.properties.id) return;
          if (!is(node, ctx.indexOf(node), ctx.parent(node))) return;
          if (headingProperties) {
            for (const [key, value] of Object.entries(
              build(headingProperties, node)
            )) {
              ctx.setProperty(node, key, value);
            }
          }
          if (behavior === "wrap") {
            const before = typeof content === "function" ? [] : node.children;
            ctx.setProperty(node, "children", [
              link(node, [...before, ...contentOf(node)])
            ]);
          } else if (behavior === "before" || behavior === "after") {
            const anchor = link(node, contentOf(node));
            const nodes =
              behavior === "before" ? [anchor, node] : [node, anchor];
            const grouping =
              group === undefined ? undefined : build(group, node);
            ctx.replaceNode(
              node,
              grouping?.type === "element"
                ? [{ ...grouping, children: nodes }]
                : nodes
            );
          } else if (behavior === "prepend") {
            ctx.prependChild(node, link(node, contentOf(node)));
          } else {
            ctx.appendChild(node, link(node, contentOf(node)));
          }
        }
      }
    });
  };
