// hast Properties values are PropertyValue (string|number|boolean|null|undefined|array); class/css-module are known-string by convention.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import type { Node } from "unist";
import type { Properties } from "hast";
import type { Attr, DelimiterRange } from "./types.js";
import { getAttrs } from "./getAttrs.js";

type AttrNode = Node & { data?: { hProperties?: Properties } };

/**
 * The class mdast-util-to-hast gives the node's element itself, if any. It sets that one under `className` and then copies hProperties over it, so `class` from a block would be serialized as a second attribute, of which browsers read the first.
 */
const generatedClass = (node: Node): string | undefined => {
  const { checked, children } = node as {
    checked?: unknown;
    children?: Array<{ checked?: unknown }>;
  };
  if (node.type === "listItem" && typeof checked === "boolean")
    return "task-list-item";
  if (
    node.type === "list" &&
    children?.some((item) => typeof item.checked === "boolean")
  )
    return "contains-task-list";
  return undefined;
};

export const applyAttrs = (
  node: AttrNode,
  content: string,
  range: DelimiterRange,
  allowed: Array<string | RegExp>
): void => {
  const attrs: Attr[] = getAttrs(content, range, allowed);
  if (attrs.length === 0) return;

  node.data ??= {};
  node.data.hProperties ??= {};
  const props = node.data.hProperties;

  for (const [key, value] of attrs) {
    if (key === "class") {
      const { className } = props;
      const generated = generatedClass(node);
      if (className !== undefined && className !== null) {
        // The node's classes are already under `className` (another plugin's, or the ones below): add to them, so the element keeps one `class` attribute.
        props.className = [
          ...(Array.isArray(className) ? className : [String(className)]),
          value
        ];
      } else if (generated) {
        // The block's classes first, as Sätteri orders them.
        const existing = props.class as string | undefined;
        props.className = [...(existing ? [existing] : []), value, generated];
        delete props.class;
      } else {
        const existing = props.class as string | undefined;
        props.class = existing ? `${existing} ${value}` : value;
      }
    } else if (key === "css-module") {
      const existing = props["css-module"] as string | undefined;
      props["css-module"] = existing ? `${existing} ${value}` : value;
    } else {
      props[key] = value;
    }
  }
};
