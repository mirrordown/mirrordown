// hast Properties values are PropertyValue (string|number|boolean|null|undefined|array); class/css-module are known-string by convention.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import type { Node } from "unist";
import type { Properties } from "hast";
import type { Attr, DelimiterRange } from "./types.js";
import { getAttrs } from "./getAttrs.js";

type AttrNode = Node & { data?: { hProperties?: Properties } };

// Lists known to hold a task item, or not. The answer reads every item, and a list given a block by each line written lazily outside its items would read them all once per block; nothing the plugin does adds an item or checks one.
const taskLists = new WeakMap<Node, boolean>();
const holdsTask = (
  list: Node,
  items: Array<{ checked?: unknown }> | undefined
): boolean => {
  let holds = taskLists.get(list);
  if (holds === undefined) {
    holds = items?.some((item) => typeof item.checked === "boolean") ?? false;
    taskLists.set(list, holds);
  }
  return holds;
};

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
  if (node.type === "list" && holdsTask(node, children))
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
      if (className !== undefined) {
        // The node's classes are already under `className` (another plugin's, or the ones below): add to them, so the element keeps one `class` attribute.
        props.className = [className, value].flat();
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
    } else if (!(key.toLowerCase() in Object.prototype)) {
      // hast-util-to-html looks every name up in property-information's table of HTML names after lower-casing it, and that table is a plain object: a name that lower-cases to a member every object inherits (`constructor`, `__proto__`) is found there, resolves to nothing, and the serializer throws for the whole document. Such a name is left out; markdown-it and Sätteri print it.
      props[key] = value;
    }
  }
};
