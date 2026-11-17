import {
  ALERT_ALIASES,
  DEFAULT_TITLE,
  type AlertOptions,
  type AlertType
} from "./types.js";
import { ICONS } from "./icons.js";
import { carryEscapes, textEscapes, type TextLikeNode } from "../escapes.js";

export { ALERT_ALIASES, DEFAULT_TITLE, ICONS };
export type { AlertOptions, AlertType };

// Groups: 1=type keyword, 2=foldable marker (+/-)
const MARKER_RE = /^\[!([^\]]+)\]([+-])?/;

/** Whether a source line opens an alert (`> [!NOTE]`), after its `>` markers and indentation, whether or not the alerts plugin reads it: a block that takes the quote after it as more of its content (a step body) leaves an alert be. */
export const isAlertMarkerLine = (line: string): boolean =>
  MARKER_RE.test(line.replace(/^[ 	>]*/, ``));

const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

/** How an alert keyword resolves under a plugin's options. */
export interface AlertResolver {
  /** The canonical type for a `[!KEYWORD]`, or `undefined` if it is not an alert. */
  resolve: (keyword: string) => string | undefined;
  /** The title shown when the alert has no custom title. */
  titleFor: (type: string) => string;
  /** The icon SVG for the title, or `""` when icons are off. */
  iconFor: (type: string) => string;
  /** The alert container's CSS class. */
  containerClass: string;
}

/** Resolve alert keywords, titles and icons the same way in every engine. */
export const createAlertResolver = (
  options: AlertOptions = {}
): AlertResolver => {
  const {
    types: extraTypes = {},
    titles = {},
    matchCaseInsensitive = true,
    icons = true,
    containerClass = `markdown-alert`
  } = options;
  // Own properties only, wherever a keyword or type from the document is the key: `constructor` and `toString` are members of every object, and are not alerts.
  const own = <V>(
    map: Partial<Record<string, V>>,
    key: string
  ): V | undefined => (Object.hasOwn(map, key) ? map[key] : undefined);
  // A keyword is lowercased before the lookup, so the keys of `options.types` are too.
  const aliasMap: Record<string, string> = {
    ...ALERT_ALIASES,
    ...(matchCaseInsensitive
      ? Object.fromEntries(
          Object.entries(extraTypes).map(([key, type]) => [
            key.toLowerCase(),
            type
          ])
        )
      : extraTypes)
  };
  // Titles may name user-defined types from `options.types` too.
  const customTitles: Partial<Record<string, string>> = titles;
  const isAlertType = (type: string): type is AlertType =>
    Object.hasOwn(DEFAULT_TITLE, type);
  return {
    resolve: (keyword) =>
      own(aliasMap, matchCaseInsensitive ? keyword.toLowerCase() : keyword),
    // A user-defined type may have no default title; capitalize the keyword as a last resort.
    titleFor: (type) =>
      own(customTitles, type) ??
      (isAlertType(type) ? DEFAULT_TITLE[type] : undefined) ??
      capitalize(type),
    iconFor: (type) => (icons && isAlertType(type) ? ICONS[type] : ``),
    containerClass
  };
};

/** The shape of an mdast phrasing node this module reads and builds. */
export interface PhrasingLike {
  type: string;
  value?: string;
  alt?: string | null | undefined;
  children?: readonly PhrasingLike[];
  position?: TextLikeNode[`position`];
  data?: object | undefined;
}

/** A paragraph that opens with an alert marker, split into its parts. */
export interface AlertParagraph<N extends PhrasingLike> {
  /** The `[!KEYWORD]` text, before alias resolution. */
  keyword: string;
  /** `+` (open) or `-` (closed) for a foldable alert, else `undefined`. */
  fold: `+` | `-` | undefined;
  /** The first line after the marker: the custom title, formatting included. */
  titleNodes: N[];
  /** The title's plain text (text, inline code and image alt), for `aria-label`. */
  titleText: string;
  /** Everything after the first line break (soft or hard): the paragraph's body. */
  bodyNodes: N[];
}

/** Plain text of inline content: text, inline code and image alt count; raw HTML does not. */
export const plainText = (nodes: readonly PhrasingLike[]): string =>
  nodes
    .map((n) =>
      n.type === `text` || n.type === `inlineCode`
        ? (n.value ?? ``)
        : n.type === `image`
          ? (n.alt ?? ``)
          : n.children
            ? plainText(n.children)
            : ``
    )
    .join(``);

// A copy of text node `node` holding its characters from `from` up to `to`. Given the document's `source`, the copy records which of its characters were escaped and has no position, as the node's no longer describes it: a span plugin that runs later reads `\==` in the copy as it would in the node. Without `source` there is nothing to tell an escape by, and the copy keeps the node's position.
const slice = <N extends PhrasingLike>(
  node: N,
  source: string | undefined,
  from: number,
  to?: number
): N => {
  const copy = { ...node, value: (node.value ?? ``).slice(from, to) };
  if (source === undefined) return copy;
  delete copy.position;
  carryEscapes(copy, textEscapes(node, source), from);
  return copy;
};

// A text node without the whitespace at its `start`, its `end` or both.
const trim = <N extends PhrasingLike>(
  node: N,
  source: string | undefined,
  start: boolean,
  end: boolean
): N => {
  const value = node.value ?? ``;
  return slice(
    node,
    source,
    start ? value.length - value.trimStart().length : 0,
    end ? value.trimEnd().length : value.length
  );
};

const LINE_ENDING = /\r\n?|\n/;

/**
 * Split an alert's first paragraph (an mdast `paragraph`'s children) into its marker, title and body, or return `null` when it does not open with a `[!KEYWORD]` marker in plain text. The first line is the marker plus an optional title; everything after the first line break — a line ending inside a text node (soft) or a `break` node (hard) — is the body. Nothing is dropped. Text nodes are copied; other nodes are reused as they are.
 *
 * Pass the document's `source` when the nodes have positions: a marker with an escaped character (`\[!NOTE]`) is then text, as it is in markdown-it, and the copies of text nodes keep which of their characters were escaped.
 */
export const splitAlertParagraph = <N extends PhrasingLike>(
  children: readonly N[],
  source?: string
): AlertParagraph<N> | null => {
  const [first, ...rest] = children;
  if (first?.type !== `text` || first.value === undefined) return null;
  const opening = first.value.trimStart();
  const match = MARKER_RE.exec(opening);
  if (!match) return null;
  const [, keyword = ``, foldMarker] = match;
  const start = first.value.length - opening.length;
  const escaped =
    source === undefined ? new Set<number>() : textEscapes(first, source);
  const bracketed = keyword.length + 3;
  for (let i = 0; i < bracketed; i++) {
    if (escaped.has(start + i)) return null;
  }
  // An escaped `+` or `-` is the title's first character.
  const fold = escaped.has(start + bracketed) ? undefined : foldMarker;

  const line: N[] = [];
  const body: N[] = [];
  for (const child of [
    slice(first, source, start + bracketed + (fold ? 1 : 0)),
    ...rest
  ]) {
    const ending =
      child.type === `text` ? LINE_ENDING.exec(child.value ?? ``) : null;
    if (body.length > 0 || line.at(-1)?.type === `break`) {
      body.push(child);
    } else if (ending) {
      line.push(slice(child, source, 0, ending.index));
      body.push(slice(child, source, ending.index + ending[0].length));
    } else {
      line.push(child);
    }
  }
  if (line.at(-1)?.type === `break`) line.pop();

  const titleNodes = line
    .map((n, i) =>
      n.type === `text` ? trim(n, source, i === 0, i === line.length - 1) : n
    )
    .filter((n) => n.type !== `text` || n.value !== ``);
  const lastTitle = titleNodes.at(-1);
  if (lastTitle?.type === `text`) {
    titleNodes[titleNodes.length - 1] = trim(lastTitle, source, false, true);
  }

  return {
    keyword,
    fold: fold === `+` || fold === `-` ? fold : undefined,
    titleNodes,
    titleText: plainText(titleNodes).trim(),
    bodyNodes: body.filter((n) => n.type !== `text` || n.value !== ``)
  };
};
