// Token.meta is typed `any` by markdown-it; the reads below check its shape.
import type { PluginSimple } from "markdown-it";
import type StateCore from "markdown-it/lib/rules_core/state_core.mjs";
import type Token from "markdown-it/lib/token.mjs";
import {
  CAPTION_CLASS,
  containersKept,
  isAlertMarkerLine,
  isCaptionLine,
  itemColumns,
  startsCaption,
  stripCaptionMarker,
  type LineContainer
} from "@mirrordown/core";

/** The closing tokens of blocks a caption doesn't attach to (headings, thematic breaks, raw HTML, front matter, another caption's figure, and the titles, labels and terms inside containers): a caption after them stays text. */
const UNCAPTIONED = new Set([
  `heading_close`,
  `hr`,
  `html_block`,
  `front_matter`,
  `figure_close`,
  `dt_close`,
  `p_close`,
  `summary_close`,
  `steps_title_close`,
  `tab_label_close`,
  `tabs_labels_close`,
  `tab_input`
]);

const BREAKS = new Set([`softbreak`, `hardbreak`]);

// The attributes a caption's figure takes: its class, then those written at the end of the caption (a class joins it). A table cell's alignment stays with the table.
const figureAttrs = (
  author: ReadonlyArray<[string, string]>
): Array<[string, string]> => {
  const classes = [CAPTION_CLASS];
  const rest: Array<[string, string]> = [];
  for (const [name, value] of author) {
    if (name === `class`) classes.push(...value.split(` `).filter(Boolean));
    else if (!(name === `style` && value.startsWith(`text-align:`)))
      rest.push([name, value]);
  }
  return [[`class`, classes.join(` `)], ...rest];
};

// The token closing the block `tokens[open]` opens (itself for a block of one token), by balancing opening and closing tokens, as `parentOf` does.
const closeOf = (tokens: readonly Token[], open: number): number => {
  if (tokens[open]?.nesting !== 1) return open;
  let depth = 0;
  for (let i = open + 1; i < tokens.length; i++) {
    const nesting = tokens[i]!.nesting;
    if (nesting === 1) depth++;
    else if (nesting === -1) {
      if (depth === 0) return i;
      depth--;
    }
  }
  return open;
};

// The token opening the block `tokens[close]` closes.
const openOf = (tokens: readonly Token[], close: number): number => {
  if (tokens[close]?.nesting !== -1) return close;
  let depth = 0;
  for (let i = close - 1; i >= 0; i--) {
    const nesting = tokens[i]!.nesting;
    if (nesting === -1) depth++;
    else if (nesting === 1) {
      if (depth === 0) return i;
      depth--;
    }
  }
  return close;
};

// The token opening the block `tokens[index]` is in (`-1` at the top level), by balancing opening and closing tokens: some plugins create tokens without setting their level (mdit-github-alerts' title).
const parentOf = (tokens: readonly Token[], index: number): number => {
  let depth = 0;
  for (let i = index - 1; i >= 0; i--) {
    const nesting = tokens[i]!.nesting;
    if (nesting === -1) depth++;
    else if (nesting === 1) {
      if (depth === 0) return i;
      depth--;
    }
  }
  return -1;
};

// An alert's container, which mdit-github-alerts marks.
const isAlert = (token: Token | undefined): boolean => {
  const meta: unknown = token?.meta;
  return (
    typeof meta === `object` &&
    meta !== null &&
    `githubAlert` in meta &&
    meta.githubAlert === true
  );
};

// Inline children split into lines at each soft or hard break, which ends its line.
const toLines = (children: readonly Token[]): Token[][] => {
  const lines: Token[][] = [[]];
  for (const child of children) {
    lines.at(-1)!.push(child);
    if (BREAKS.has(child.type)) lines.push([]);
  }
  return lines;
};

// A caption's lines as inline children, without the marker on the first and the break ending the last.
const captionChildren = (lines: Token[][]): Token[] => {
  const children = lines.flat();
  if (BREAKS.has(children.at(-1)?.type ?? ``)) children.pop();
  const first = children[0];
  if (first?.type === `text`) {
    first.content = stripCaptionMarker(first.content);
    if (first.content === ``) children.shift();
  }
  return children;
};

// Only images (each possibly inside a link) and whitespace.
const onlyImages = (children: readonly Token[]): boolean => {
  let images = 0;
  let link = false;
  for (const child of children) {
    if (child.type === `image`) images++;
    else if (child.type === `link_open` && !link) link = true;
    else if (child.type === `link_close` && link) link = false;
    else if (
      !(child.type === `text` && child.content.trim() === ``) &&
      !BREAKS.has(child.type)
    )
      return false;
  }
  return images > 0;
};

/**
 * markdown-it plugin that captions a block with a `~:` line right after it: the block goes in a `<figure class="markdown-caption">` whose `<figcaption>` holds the caption, which runs to the end of its paragraph and can hold inline markdown. An image alone in its paragraph is the figure's content itself. The `>` markers and indentation a caption line is written with decide which block it captions; attributes ending a caption (with markdown-it-attrs) go on the figure. Recognition is shared with the remark and Sätteri plugins through `@mirrordown/core`.
 */
export const caption: PluginSimple = (md) => {
  md.core.ruler.push(`caption`, (state: StateCore) => {
    if (!state.src.includes(`~:`)) return;
    const { tokens } = state;
    const lines = state.src.split(`\n`);
    // Tokens to insert before and after others, and tokens to drop, applied once at the end.
    const before = new Map<Token, Token[]>();
    const after = new Map<Token, Token[]>();
    const dropped = new Set<Token>();

    const make = (type: string, tag: string, nesting: 1 | 0 | -1): Token => {
      const token = new state.Token(type, tag, nesting);
      token.block = true;
      return token;
    };
    // Wrap the block from `open` to `close` in a figure with the caption.
    const wrap = (
      open: Token,
      close: Token,
      children: Token[],
      author: ReadonlyArray<[string, string]>
    ): void => {
      const figureOpen = make(`figure_open`, `figure`, 1);
      figureOpen.attrs = figureAttrs(author);
      const inline = make(`inline`, ``, 0);
      inline.block = false;
      inline.children = children;
      inline.content = children.map((c) => c.content).join(``);
      before.set(open, [figureOpen, ...(before.get(open) ?? [])]);
      after.set(close, [
        ...(after.get(close) ?? []),
        make(`figcaption_open`, `figcaption`, 1),
        inline,
        make(`figcaption_close`, `figcaption`, -1),
        make(`figure_close`, `figure`, -1)
      ]);
    };
    const takeAttrs = (token: Token | undefined): Array<[string, string]> => {
      const attrs = token?.attrs ?? [];
      if (token) token.attrs = null;
      return attrs;
    };
    const captioned = new Set<Token>();

    // The blocks around `tokens[index]` a line can be written outside of, outermost first, up to the first holding its own source (a tab panel or step body tokenized from its body, whose token maps index that); and the source lines its maps index.
    const contextOf = (
      index: number
    ):
      | {
          lines: string[];
          containers: Array<{ target: Token; line: LineContainer }>;
        }
      | undefined => {
      const ancestors: Token[] = [];
      let source: string[] = lines;
      for (let i = parentOf(tokens, index); i >= 0; i = parentOf(tokens, i)) {
        const token = tokens[i]!;
        const meta: unknown = token.meta;
        const own =
          typeof meta === `object` && meta !== null && `attrsSource` in meta
            ? meta.attrsSource
            : undefined;
        if (typeof own === `string`) {
          source = own.split(`\n`);
          break;
        }
        ancestors.unshift(token);
      }
      const containers: Array<{ target: Token; line: LineContainer }> = [];
      const items: Token[] = [];
      let quotes = 0;
      for (const [i, open] of ancestors.entries()) {
        if (open.type === `blockquote_open` || isAlert(open)) {
          containers.push({
            target: open,
            line: { kind: `quote`, markers: ++quotes }
          });
        } else if (open.type === `list_item_open` && open.map) {
          // Items opened on the same line as this one, outside it, come first there.
          const sameLine = items.filter(
            (item) => item.map?.[0] === open.map![0]
          ).length;
          items.push(open);
          const column = itemColumns(source[open.map[0]] ?? ``).at(sameLine);
          if (column === undefined) return undefined;
          containers.push({
            target: ancestors[i - 1] ?? open,
            line: { kind: `item`, column }
          });
        } else if (open.type === `dd_open` && open.map) {
          const marker = /^[ \t>]*[:~][ \t]+/.exec(source[open.map[0]] ?? ``);
          if (!marker) return undefined;
          containers.push({
            target: ancestors[i - 1] ?? open,
            line: { kind: `item`, column: marker[0].length }
          });
        }
      }
      return { lines: source, containers };
    };

    // Tables: a caption line is a row of its own; it and the rows after it are the caption.
    for (const [index, token] of tokens.entries()) {
      if (token.type !== `table_open`) continue;
      const close = closeOf(tokens, index);
      const source = contextOf(index)?.lines ?? lines;
      const rows: Array<{ open: number; close: number }> = [];
      let inBody = false;
      for (let i = index + 1; i < close; i++) {
        const t = tokens[i]!;
        if (t.type === `tbody_open`) inBody = true;
        if (inBody && t.type === `tr_open`)
          rows.push({ open: i, close: closeOf(tokens, i) });
      }
      const first = rows.findIndex(({ open }) => {
        const tr = tokens[open]!;
        const text = tokens[open + 2]?.children?.[0];
        return (
          tr.map !== null &&
          isCaptionLine(source[tr.map[0]] ?? ``) &&
          text?.type === `text` &&
          startsCaption(text.content)
        );
      });
      if (first === -1) continue;
      const captionRows = rows.slice(first);
      const captionLines = captionRows.map(({ open }) => {
        const lineEnd = new state.Token(`softbreak`, `br`, 0);
        return [...(tokens[open + 2]?.children ?? []), lineEnd];
      });
      const author = takeAttrs(tokens[captionRows.at(-1)!.open + 1]);
      for (const { open, close: rowClose } of captionRows)
        for (let i = open; i <= rowClose; i++) dropped.add(tokens[i]!);
      // A body left without rows goes too, as remark leaves it out.
      if (first === 0)
        for (let i = index; i < close; i++)
          if (tokens[i]!.type.startsWith(`tbody_`)) dropped.add(tokens[i]!);
      wrap(token, tokens[close]!, captionChildren(captionLines), author);
      captioned.add(token);
    }

    // Paragraphs, last first, so a figure made inside a block is in place before the block is wrapped.
    for (let index = tokens.length - 1; index >= 0; index--) {
      const open = tokens[index]!;
      if (open.type !== `paragraph_open` || !open.map) continue;
      const inline = tokens[index + 1];
      const close = tokens[index + 2];
      if (inline?.type !== `inline` || !inline.children || !close) continue;
      const context = contextOf(index);
      if (!context) continue;
      const paraLines = toLines(inline.children);
      // Each line is one source line. An alert's first paragraph lost its marker line (`> [!NOTE]`) to the alert, which leaves its map there.
      const start =
        open.map[0] +
        Number(
          isAlert(tokens[parentOf(tokens, index)]) &&
            isAlertMarkerLine(context.lines[open.map[0]] ?? ``)
        );
      const isCaptionAt = (i: number): boolean => {
        const text = paraLines[i]?.[0];
        return (
          isCaptionLine(context.lines[start + i] ?? ``) &&
          text?.type === `text` &&
          startsCaption(text.content)
        );
      };

      // A paragraph that is a caption: it captions the block right before it, on the line above.
      if (isCaptionAt(0)) {
        const previous = tokens[index - 1];
        const above = context.lines[start - 1];
        if (
          !previous ||
          previous.nesting === 1 ||
          UNCAPTIONED.has(previous.type) ||
          above === undefined ||
          above.replace(/^[ \t>]*/, ``) === `` ||
          // A link reference definition, which markdown-it keeps out of the token stream (remark's `definition` node is uncaptioned).
          /^[ \t>]*\[[^\]]+\]:/.test(above) ||
          captioned.has(tokens[openOf(tokens, index - 1)]!)
        )
          continue;
        const author = takeAttrs(open);
        dropped.add(open).add(inline).add(close);
        const target = tokens[openOf(tokens, index - 1)]!;
        wrap(target, previous, captionChildren(paraLines), author);
        captioned.add(target);
        continue;
      }

      // A caption line inside the paragraph: the paragraph, or a block around it the line is written outside of.
      const { containers } = context;
      const segments: Array<{ line: number; kept: number; target: Token }> = [];
      for (let i = 1; i < paraLines.length; i++) {
        if (!isCaptionAt(i)) continue;
        const kept = containersKept(
          context.lines[start + i] ?? ``,
          containers.map((c) => c.line)
        );
        const previous = segments.at(-1);
        if (previous && kept >= previous.kept) continue;
        const target = containers[kept]?.target ?? open;
        if (captioned.has(target)) continue;
        segments.push({ line: i, kept, target });
      }
      if (segments.length === 0) continue;

      const head = paraLines.slice(0, segments[0]!.line).flat();
      // The break before the caption ends the paragraph instead.
      if (BREAKS.has(head.at(-1)?.type ?? ``)) head.pop();
      const author = takeAttrs(open);
      for (const [i, segment] of segments.entries()) {
        const children = captionChildren(
          paraLines.slice(segment.line, segments[i + 1]?.line)
        );
        const properties = i === segments.length - 1 ? author : [];
        const { target } = segment;
        if (target === open) {
          // An image alone is the figure's content; otherwise the paragraph shows, even in a tight list.
          open.hidden = close.hidden = onlyImages(head);
          wrap(open, close, children, properties);
        } else {
          wrap(
            target,
            tokens[closeOf(tokens, tokens.indexOf(target))]!,
            children,
            properties
          );
        }
        captioned.add(target);
      }
      inline.children = head;
      inline.content = head.map((c) => c.content).join(``);
    }

    if (before.size === 0 && after.size === 0) return;
    state.tokens = tokens.flatMap((token) =>
      dropped.has(token)
        ? []
        : [...(before.get(token) ?? []), token, ...(after.get(token) ?? [])]
    );
  });
};
