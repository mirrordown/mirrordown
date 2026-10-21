import {
  ALERT_ALIASES,
  DEFAULT_TITLE,
  type AlertOptions,
  type AlertType
} from "./types.js";
import { ICONS } from "./icons.js";

export { ALERT_ALIASES, DEFAULT_TITLE, ICONS };
export type { AlertOptions, AlertType };

// Groups: 1=type keyword, 2=foldable marker (+/-)
const MARKER_RE = /^\[!([^\]]+)\]([+-])?/;

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
  const aliasMap: Record<string, string> = { ...ALERT_ALIASES, ...extraTypes };
  // Titles may name user-defined types from `options.types` too.
  const customTitles: Partial<Record<string, string>> = titles;
  const isAlertType = (type: string): type is AlertType =>
    type in DEFAULT_TITLE;
  return {
    resolve: (keyword) =>
      aliasMap[matchCaseInsensitive ? keyword.toLowerCase() : keyword],
    // A user-defined type may have no default title; capitalize the keyword as a last resort.
    titleFor: (type) =>
      customTitles[type] ??
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

const withValue = <N extends PhrasingLike>(node: N, value: string): N => ({
  ...node,
  value
});

/**
 * Split an alert's first paragraph (an mdast `paragraph`'s children) into its marker, title and body, or return `null` when it does not open with a `[!KEYWORD]` marker in plain text. The first line is the marker plus an optional title; everything after the first line break — a newline inside a text node (soft) or a `break` node (hard) — is the body. Nothing is dropped. Text nodes are copied; other nodes are reused as they are.
 */
export const splitAlertParagraph = <N extends PhrasingLike>(
  children: readonly N[]
): AlertParagraph<N> | null => {
  const [first, ...rest] = children;
  if (first?.type !== `text` || first.value === undefined) return null;
  const opening = first.value.trimStart();
  const match = MARKER_RE.exec(opening);
  if (!match) return null;
  const [marker, keyword = ``, fold] = match;

  const line: N[] = [];
  const body: N[] = [];
  for (const child of [
    withValue(first, opening.slice(marker.length)),
    ...rest
  ]) {
    if (body.length > 0 || line.at(-1)?.type === `break`) {
      body.push(child);
    } else if (child.type === `text` && child.value?.includes(`\n`)) {
      const at = child.value.indexOf(`\n`);
      line.push(withValue(child, child.value.slice(0, at)));
      body.push(withValue(child, child.value.slice(at + 1)));
    } else {
      line.push(child);
    }
  }
  if (line.at(-1)?.type === `break`) line.pop();

  const trimmed = line.map((n, i) =>
    n.type !== `text`
      ? n
      : withValue(
          n,
          i === 0 && i === line.length - 1
            ? (n.value ?? ``).trim()
            : i === 0
              ? (n.value ?? ``).trimStart()
              : i === line.length - 1
                ? (n.value ?? ``).trimEnd()
                : (n.value ?? ``)
        )
  );
  const titleNodes = trimmed.filter((n) => n.type !== `text` || n.value !== ``);
  const lastTitle = titleNodes.at(-1);
  if (lastTitle?.type === `text`) {
    titleNodes[titleNodes.length - 1] = withValue(
      lastTitle,
      (lastTitle.value ?? ``).trimEnd()
    );
  }

  return {
    keyword,
    fold: fold === `+` || fold === `-` ? fold : undefined,
    titleNodes,
    titleText: plainText(titleNodes).trim(),
    bodyNodes: body.filter((n) => n.type !== `text` || n.value !== ``)
  };
};
