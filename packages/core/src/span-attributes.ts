// Attribute blocks written right after an inline span a plugin builds (`--x--{.cls}`). A parser that reads attribute blocks before its plugins run (Sätteri) never sees that span: a block in the middle of a paragraph stays the text that follows the span, and one that ends the paragraph has already gone on the paragraph, or on the block that holds it. These helpers give the span both, as markdown-it and remark do, whose attrs plugins run once the span exists.
import type { Properties } from "hast";
import { mergeProperties, type ReadAttributes } from "./cut-attributes.js";
import { unmaskEscaped } from "./escapes.js";

/** A parser's document-to-mdast function, as far as reading an attribute block needs it. */
type ParseMdast = (
  source: string,
  options: { features: { attributes: true } }
) => {
  children: ReadonlyArray<{
    type: string;
    data?: unknown;
    children?: ReadonlyArray<{ type: string; value?: unknown }>;
  }>;
};

/**
 * Builds the reader of an attribute block from Sätteri's own parser (`markdownToMdast`): the properties the parser gives a paragraph for the block written after its text, if all of it is one block. The parser decides what a block is, so nothing here can read one differently from it.
 */
export const createAttributeReader =
  (parse: ParseMdast): ReadAttributes =>
  (block) => {
    const para = parse(`x ${block}`, { features: { attributes: true } })
      .children[0];
    const text = para?.type === `paragraph` ? (para.children ?? []) : [];
    const data = para?.data;
    return text.length === 1 &&
      text[0]?.type === `text` &&
      text[0].value === `x` &&
      typeof data === `object` &&
      data !== null &&
      `hProperties` in data
      ? // What the parser wrote there: hast properties.
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        (data.hProperties as Properties | undefined)
      : undefined;
  };

/**
 * The attribute blocks `value` opens with, joined, and the text left after them, or `undefined` when it opens with none. A block ends at the first `}` that makes it one, on the line it opens on. `value` may be masked (see `maskEscaped`): an escaped brace opens or closes nothing, and a block that holds an escaped character is text, as it is to markdown-it.
 */
export const leadingAttributes = (
  value: string,
  read: ReadAttributes
): { properties: Properties; rest: string } | undefined => {
  let properties: Properties | undefined;
  let rest = value;
  while (rest.startsWith(`{`)) {
    const line = /^[^\r\n]*/.exec(rest)?.[0] ?? ``;
    let block: Properties | undefined;
    let close = line.indexOf(`}`);
    for (; close !== -1; close = line.indexOf(`}`, close + 1)) {
      const written = line.slice(0, close + 1);
      block = unmaskEscaped(written) === written ? read(written) : undefined;
      if (block) break;
    }
    if (!block) break;
    properties = mergeProperties(properties, block);
    rest = rest.slice(close + 1);
  }
  return properties && { properties, rest };
};

// What a block's source ends with after its inline content and the attribute block that follows it: a table cell's pipe, a setext heading's underline.
const AFTER_CONTENT: Record<string, RegExp> = {
  tableCell: /[ \t|]+$/,
  heading: /\r?\n[ \t>]*(?:=+|-+)[ \t]*$/
};

/**
 * The properties of the attribute block that ends `written`, the source of a block of inline content (a paragraph, a heading, a table cell of type `parentType`), when it touches the content before it: `--x--{.cls}`, and not `--x-- {.cls}`, whose block is the paragraph's own. A block on a line of its own is the paragraph's too, and the parser reads the block ending the line before it as well, so that one is looked at next.
 */
const touchingAttributes = (
  written: string,
  parentType: string,
  read: ReadAttributes
): Properties | undefined => {
  let tail = written.replace(AFTER_CONTENT[parentType] ?? /$/, ``).trimEnd();
  while (tail.endsWith(`}`)) {
    const lineStart =
      Math.max(tail.lastIndexOf(`\n`), tail.lastIndexOf(`\r`)) + 1;
    let properties: Properties | undefined;
    let open = tail.lastIndexOf(`{`);
    for (; open >= lineStart; open = tail.lastIndexOf(`{`, open - 1)) {
      properties = read(tail.slice(open));
      if (properties || open === 0) break;
    }
    if (!properties) return undefined;
    const before = tail.slice(lineStart, open);
    if (lineStart > 0 && /^[ \t>]*$/.test(before)) {
      tail = tail.slice(0, lineStart).trimEnd();
      continue;
    }
    return /[^ \t]$/.test(before) ? properties : undefined;
  }
  return undefined;
};

// `held` without `taken`, or `undefined` when it doesn't hold all of it: a class is taken once, from the end, where the parser adds the classes of the block it reads last.
const withoutProperties = (
  held: Properties,
  taken: Properties
): Properties | undefined => {
  const rest = new Map(Object.entries(held));
  for (const [key, value] of Object.entries(taken)) {
    const own = rest.get(key);
    if (Array.isArray(value) && Array.isArray(own)) {
      const kept = [...own];
      for (const item of value) {
        const at = kept.lastIndexOf(item);
        if (at === -1) return undefined;
        kept.splice(at, 1);
      }
      if (kept.length > 0) rest.set(key, kept);
      else rest.delete(key);
    } else if (own === value) {
      rest.delete(key);
    } else {
      return undefined;
    }
  }
  return Object.fromEntries(rest);
};

/** A node the parser may have given a block's trailing attributes to. */
interface Holder {
  data?: object | null | undefined;
}

/**
 * Takes back the attribute block the parser read off the end of a block of inline content whose last node is a span a plugin built, when the block was written touching that span. `written` is the source of the content's parent, of type `parentType`; `holders` are the nodes the parser may have put the attributes on: the parent, then the block that holds it (a list item, a description). Returns the span's `properties`, the `holder` they came from and the `data` it is left with, or `undefined` when the block is not the span's.
 */
export const claimTrailingAttributes = <H extends Holder>(
  written: string,
  parentType: string,
  holders: ReadonlyArray<H | undefined>,
  read: ReadAttributes
):
  | { properties: Properties; holder: H; data: Record<string, unknown> }
  | undefined => {
  const properties = touchingAttributes(written, parentType, read);
  if (!properties) return undefined;
  for (const holder of holders) {
    const data = holder?.data;
    if (!holder || !data || !(`hProperties` in data)) continue;
    // What the parser wrote there: hast properties.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const held = data.hProperties as Properties | null | undefined;
    const rest = held && withoutProperties(held, properties);
    if (!rest) continue;
    const { hProperties: _, ...others } = { ...data };
    return {
      properties,
      holder,
      data:
        Object.keys(rest).length > 0 ? { ...others, hProperties: rest } : others
    };
  }
  return undefined;
};

/** Adds `properties` to those a built node renders with (its `data.hProperties`): classes join the node's own, other attributes replace them. */
export const addProperties = (
  node: { data?: object | undefined },
  properties: Properties
): void => {
  const own =
    node.data && `hProperties` in node.data
      ? // Written by the plugin that built the node: hast properties.
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        (node.data.hProperties as Properties | undefined)
      : undefined;
  node.data = {
    ...node.data,
    hProperties: mergeProperties(own, properties)
  };
};
