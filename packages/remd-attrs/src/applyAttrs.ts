// hast Properties values are PropertyValue (string|number|boolean|null|undefined|array); class/css-module are known-string by convention.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import type { Node } from "unist";
import type { Properties } from "hast";
import type { Attr, DelimiterRange } from "./types.js";
import { getAttrs } from "./getAttrs.js";

type AttrNode = Node & { data?: { hProperties?: Properties } };

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
      const existing = props.class as string | undefined;
      props.class = existing ? `${existing} ${value}` : value;
    } else if (key === "css-module") {
      const existing = props["css-module"] as string | undefined;
      props["css-module"] = existing ? `${existing} ${value}` : value;
    } else {
      props[key] = value;
    }
  }
};
