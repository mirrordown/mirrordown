// Lazy continuation, shared by the steps and tabs recognition: CommonMark lets a line without a blockquote's `>` markers continue the paragraph before it, so a header meant for an outer group, and the lines after it, can end up in a paragraph nested in a body. markdown-it reads such lines by their markers instead; with the document's source, so does recognition.
import type {
  Blockquote,
  BlockContent,
  DefinitionContent,
  Paragraph,
  PhrasingContent,
  Text
} from "mdast";
import type { Properties } from "hast";
import { rebuiltParagraphs } from "./cut-attributes.js";

/** A paragraph's data, with the attributes mdast-util-to-hast reads. Its type augmentation adds `hProperties` to mdast's data where it's loaded, but core doesn't load it; the intersection types the property either way. */
type ParagraphAttributes = NonNullable<Paragraph["data"]> & {
  // As the augmentation declares it, so the two agree under exactOptionalPropertyTypes.
  hProperties?: Properties | undefined;
};

/** A line ending as CommonMark reads one: a line feed, a carriage return, or both. */
const LINE_ENDING = /\r\n|\r|\n/;

/** A document's source split into its lines, so a line number counts the lines the parser's positions count, whichever line endings the document uses. */
export const splitSourceLines = (source: string): string[] =>
  source.split(LINE_ENDING);

/** The `>` markers a source line starts with. */
export const markerCount = (line: string): number =>
  (/^[ \t>]*/.exec(line)?.[0] ?? "").split(">").length - 1;

/** The `>` markers of a blockquote's own lines: those before it on its first line, and its own (that line can open nested blockquotes too). */
export const blockquoteMarkers = (
  bq: Blockquote,
  sourceLines: readonly string[]
): number | undefined => {
  const start = bq.position?.start;
  if (!start) return undefined;
  return (
    markerCount(
      (sourceLines[start.line - 1] ?? "").slice(0, start.column - 1)
    ) + 1
  );
};

/** A paragraph line, with the `>` markers its source line starts with. */
export interface MarkedLine {
  segs: PhrasingContent[];
  markers: number;
}

/** A marked line, with the number of the source line it starts on. */
export interface SourceLine extends MarkedLine {
  line: number;
}

// A paragraph's lines, each with the source line it starts on, where that's known: the line of the first content on it. A line here isn't always the one after the line before it, since inline content that spans lines (emphasis, a code span, a link) keeps them together as one.
const numberedLines = (
  para: Paragraph,
  sourceLines?: readonly string[]
): Array<{ segs: PhrasingContent[]; line: number | undefined }> => {
  let current: { segs: PhrasingContent[]; line: number | undefined } = {
    segs: [],
    line: para.position?.start.line
  };
  const lines = [current];
  const open = (line: number | undefined): void => {
    current = { segs: [], line };
    lines.push(current);
  };
  for (const child of para.children) {
    if (child.type === "break") {
      current.line ??= child.position?.start.line;
      current.segs.push(child);
      open(undefined);
    } else if (child.type === "text") {
      // A text value keeps the document's own line endings, so a carriage return ends a line too: left on its line, it would end a title or a rebuilt paragraph.
      const parts = child.value.split(LINE_ENDING);
      const position = child.position;
      // The line the text starts on. A parser's text that starts with a line ending starts at the end of the line before it, but a rebuilt paragraph's is placed where its next line's content starts (see `pushPhrasing`): the source tells the two apart.
      const rebuilt =
        position !== undefined &&
        parts.length > 1 &&
        parts[0] === "" &&
        (sourceLines?.[position.start.line - 1] ?? "")
          .slice(position.start.column - 1)
          .trim() !== "";
      const first =
        position === undefined
          ? undefined
          : position.start.line - (rebuilt ? 1 : 0);
      for (const [p, part] of parts.entries()) {
        if (p > 0) open(first === undefined ? undefined : first + p);
        else current.line ??= first;
        if (part === "") continue;
        const text: Text = { type: "text", value: part };
        if (position && first !== undefined) {
          const line = first + p;
          const source = sourceLines?.[line - 1];
          const start =
            p === 0
              ? position.start
              : source === undefined
                ? undefined
                : {
                    line,
                    column: (/^[ \t>]*/.exec(source)?.[0].length ?? 0) + 1
                  };
          const end =
            p === parts.length - 1
              ? position.end
              : source === undefined
                ? undefined
                : { line, column: source.trimEnd().length + 1 };
          if (start && end) text.position = { start, end };
        }
        current.segs.push(text);
      }
    } else {
      current.line ??= child.position?.start.line;
      current.segs.push(child);
    }
  }
  // Content without a position (a node another plugin made) is taken to start on the line after the one before it.
  for (const [index, line] of lines.entries()) {
    const before = lines[index - 1]?.line;
    if (before !== undefined) line.line ??= before + 1;
  }
  // A hard break can only end a paragraph that was cut after it (CommonMark has none at the end of a block), and no line follows it there.
  if (lines.length > 1 && current.segs.length === 0) {
    if (para.children.at(-1)?.type === "break") lines.pop();
  }
  return lines;
};

/**
 * A paragraph's phrasing content split into its lines: text at each line ending, and after a hard break, which stays at the end of its line. With the source, the text on each line keeps its place in it, as remark would give it: from after the line's container prefix to its last non-space character.
 */
export const paraToLines = (
  para: Paragraph,
  sourceLines?: readonly string[]
): PhrasingContent[][] =>
  numberedLines(para, sourceLines).map(({ segs }) => segs);

/**
 * A paragraph's lines (as `paraToLines` splits them), each with the source line it starts on and that line's `>` markers; `null` when a line's place in the source isn't known. Read a line's markers from here rather than from the paragraph's first line plus the line's index: the two differ after inline content that spans lines.
 */
export const paraToSourceLines = (
  para: Paragraph,
  sourceLines: readonly string[]
): SourceLine[] | null => {
  const lines: SourceLine[] = [];
  for (const { segs, line } of numberedLines(para, sourceLines)) {
    if (line === undefined) return null;
    lines.push({
      segs,
      line,
      markers: markerCount(sourceLines[line - 1] ?? "")
    });
  }
  return lines;
};

// The phrasing content of each line.
const segsOf = (lines: readonly MarkedLine[]): PhrasingContent[][] =>
  lines.map(({ segs }) => segs);

/**
 * A header line's content without the hard break that ends it. A header is one line, so nothing breaks after it: the spaces that made the break are trailing spaces, and a backslash is a literal one, as CommonMark reads a backslash that ends a block and as markdown-it reads the header's line. Without the source, which tells the two apart, the break is dropped.
 */
export const headerLineContent = (
  segs: PhrasingContent[],
  sourceLines?: readonly string[]
): PhrasingContent[] => {
  const last = segs.at(-1);
  if (last?.type !== "break") return segs;
  const content = segs.slice(0, -1);
  const start = last.position?.start;
  if (start && sourceLines?.[start.line - 1]?.[start.column - 1] === "\\")
    pushPhrasing(content, { type: "text", value: "\\" });
  return content;
};

/** The attributes a paragraph carries, which a parser that reads attribute blocks before recognition (Sätteri) read off its end: they belong to its last line. */
export const paragraphProperties = (
  para: Paragraph
): Properties | undefined => {
  const data: ParagraphAttributes | undefined = para.data;
  return data?.hProperties;
};

/** Appends `node` to `children`, merging text into the text before it, as remark keeps a run of text in one node. */
const pushPhrasing = (
  children: PhrasingContent[],
  node: PhrasingContent
): void => {
  const last = children.at(-1);
  if (node.type !== "text" || last?.type !== "text") {
    children.push(node);
    return;
  }
  // A line ending with no position of its own takes the next line's start.
  const start =
    last.position?.start ??
    (last.value.trim() === "" ? node.position?.start : undefined);
  const end = node.position?.end ?? last.position?.end;
  const merged: Text = { type: "text", value: last.value + node.value };
  if (start && end) merged.position = { start, end };
  children[children.length - 1] = merged;
};

/** A paragraph from lines of phrasing content, or `null` for none. Lines join with a line ending, except after a hard break, which is one. Pass the source where the paragraph is cut before a line that was part of it: a hard break that would then end the paragraph is read as CommonMark reads one at the end of a block (see `headerLineContent`). */
export const linesToParagraph = (
  lines: PhrasingContent[][],
  sourceLines?: readonly string[]
): Paragraph | null => {
  const children: PhrasingContent[] = [];
  for (const [i, line] of lines.entries()) {
    if (i > 0 && lines[i - 1]?.at(-1)?.type !== "break")
      pushPhrasing(children, { type: "text", value: "\n" });
    const segs =
      sourceLines && i === lines.length - 1
        ? headerLineContent(line, sourceLines)
        : line;
    for (const node of segs) pushPhrasing(children, node);
  }
  if (children.length === 0) return null;
  const para: Paragraph = { type: "paragraph", children };
  const start = children[0]?.position?.start;
  const end = children.at(-1)?.position?.end;
  if (start && end) para.position = { start, end };
  rebuiltParagraphs.add(para);
  return para;
};

/** The position of a blockquote written from source line `first` to `last` whose own `>` is the `nth` marker of its first line, as a parser would place it: `blockquoteMarkers` then counts `nth` for it. `undefined` when that line has no such marker. */
export const quotePosition = (
  sourceLines: readonly string[],
  first: number,
  last: number,
  nth: number
): Blockquote["position"] => {
  const source = sourceLines[first - 1] ?? "";
  const prefix = /^[ \t>]*/.exec(source)?.[0] ?? "";
  const at = prefix.split(">", nth).join(">").length;
  if (nth < 1 || at >= prefix.length) return undefined;
  return {
    start: { line: first, column: at + 1 },
    end: { line: last, column: (sourceLines[last - 1] ?? "").length + 1 }
  };
};

/**
 * The blocks lazily continued lines stand for, from their markers relative to the body they belong to (`level` deep): as such lines go on CommonMark only nests deeper, so a line with more markers opens blockquotes and a new paragraph, and a line with fewer continues the paragraph it follows. With `place` (the source, and the markers the lines' own were counted over), a blockquote among them gets its position, for recognition that reads a quote's markers after this; without it, a rebuilt blockquote has none.
 */
export const rebuildLazyLines = (
  lines: Array<MarkedLine & { line?: number }>,
  level: number,
  place?: { sourceLines: readonly string[]; over: number }
): Array<BlockContent | DefinitionContent> => {
  const deeper = lines.findIndex(({ markers }) => markers > level);
  const own = deeper === -1 ? lines : lines.slice(0, deeper);
  const para = linesToParagraph(own.map(({ segs }) => segs));
  const blocks: Array<BlockContent | DefinitionContent> = para ? [para] : [];
  if (deeper !== -1) {
    const quote: Blockquote = {
      type: "blockquote",
      children: rebuildLazyLines(lines.slice(deeper), level + 1, place)
    };
    const first = lines[deeper]?.line;
    const last = lines.at(-1)?.line;
    const position =
      place && first !== undefined && last !== undefined
        ? quotePosition(place.sourceLines, first, last, place.over + level + 1)
        : undefined;
    if (position) quote.position = position;
    blocks.push(quote);
  }
  return blocks;
};

// A node as the end-of-group pass reads the tree: mdast and the groups recognition builds.
interface GroupTreeNode {
  type: string;
  children?: GroupTreeNode[];
  position?: Paragraph["position"];
  data?: unknown;
}

/** Blocks whose lines carry one more `>` marker than the block around them: a blockquote (or an alert, Sätteri's node for one) and a tab panel or step body. A sub-item is the exception, so count a block's markers with `markerLevels`. */
export const MARKED_BLOCKS: ReadonlySet<string> = new Set([
  `blockquote`,
  `alert`,
  `tabsItem`,
  `stepsItem`
]);

/**
 * The `>` markers a block adds to its lines, over those of the block around it: one for a marked block, none for any other. A sub-item (a `@@` step, a `%%` tab) is a marked block that adds none: it's nested in its parent item, but its body is written with its parent's markers, so recognition sets `sub` in its data, which a renderer that rebuilds the node (Sätteri) keeps for the plugins after it.
 */
export const markerLevels = (node: {
  type?: string;
  data?: unknown;
}): number => {
  // The data of a recognized item, in the loose node shape the passes walk.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const data = node.data as { sub?: boolean } | null | undefined;
  return MARKED_BLOCKS.has(node.type ?? ``) && data?.sub !== true ? 1 : 0;
};

/** Blocks a line can lazily continue into by its indentation rather than its markers: a list item or a definition. */
export const INDENTED_BLOCKS: ReadonlySet<string> = new Set([
  `listItem`,
  `defListDescription`,
  `descriptionDetails`
]);

/**
 * A paragraph split before its first line (after its first) that `opens` a group (given the line's first text, and its node for where it's written), written at the paragraph's level (`quotes` `>` markers), as markdown-it's block rules interrupt a paragraph; `null` when there's none. Attributes ending the paragraph go with the part they end.
 */
export const splitAtOpeningLine = (
  para: Paragraph,
  sourceLines: readonly string[],
  quotes: number,
  opens: (text: string, node: Text) => boolean
): Paragraph[] | null => {
  const lines = paraToSourceLines(para, sourceLines);
  if (!lines) return null;
  const at = lines.findIndex(({ segs, markers }, index) => {
    const first = segs[0];
    return (
      index > 0 &&
      first?.type === `text` &&
      opens(first.value, first) &&
      markers === quotes
    );
  });
  if (at === -1) return null;
  const head = linesToParagraph(segsOf(lines.slice(0, at)), sourceLines);
  const tail = linesToParagraph(segsOf(lines.slice(at)));
  if (!head || !tail) return null;
  if (para.data) tail.data = para.data;
  return [head, tail];
};

// The paragraph a lazily continued line can end up in, with the block it's in: the deepest last block, through lists, items and quotes.
const lastParagraph = (
  node: GroupTreeNode | undefined
): { para: Paragraph; parent: GroupTreeNode } | undefined => {
  const last = node?.children?.at(-1);
  if (!node || !last) return undefined;
  if (last.type !== `paragraph`) return lastParagraph(last);
  // A paragraph of the tree, which the loose node shape doesn't name.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const para = last as unknown as Paragraph;
  return { para, parent: node };
};

/**
 * End each group of `listType` (tab groups or steps) where its last panel's `>` markers stop, as markdown-it reads a panel: a line CommonMark lazily continued into the panel's last paragraph, written with fewer markers than the panel's own lines, starts the content after the group, with the lines after it. That content is rebuilt from the lines' markers, as markdown-it parses it once the group has ended: a line with more markers than the group's surroundings opens a blockquote, so a `>` body after a header among them is still one. Groups nested in a panel are ended first; a line that leaves the outer panel too is kept as a line for the outer group to place. The paragraph's attributes (Sätteri reads them off its end) go with its last line.
 */
export const endGroupsAtMarkers = (
  root: { children: unknown[] },
  sourceLines: readonly string[],
  listType: `tabsList` | `stepsList`
): void => {
  // Paragraphs of lines that left a group nested in a panel and that panel too: unlike a parsed paragraph, their first line can be written outside the panel they're in.
  const leaving = new WeakSet<Paragraph>();
  const visit = (node: GroupTreeNode, quotes: number): void => {
    const children = node.children;
    if (!children) return;
    for (let i = 0; i < children.length; i++) {
      const child = children[i]!;
      visit(child, quotes + markerLevels(child));
      // A group ends where its last panel's markers stop. A plain blockquote keeps the lines CommonMark continued into it, except lines that left a group in it: markdown-it ends the blockquote where that group ends.
      const quote = child.type === `blockquote` || child.type === `alert`;
      if (child.type !== listType && !quote) continue;
      const item = quote ? child : child.children?.at(-1);
      const found = lastParagraph(item);
      if (quote && !(found && leaving.has(found.para))) continue;
      const lines = found && paraToSourceLines(found.para, sourceLines);
      if (!item || !found || !lines) continue;
      const { para, parent } = found;
      // The panel's lines carry one more marker than the blocks around the group; a sub-item's, as many as its parent item's, which is the block around its group.
      const panel = quotes + markerLevels(item);
      const from = leaving.has(para) ? 0 : 1;
      const outside = lines.findIndex(
        ({ markers }, index) => index >= from && markers < panel
      );
      if (outside === -1) continue;
      const kept = linesToParagraph(
        segsOf(lines.slice(0, outside)),
        sourceLines
      );
      const after = lines.slice(outside);
      let moved: Array<BlockContent | DefinitionContent>;
      if ((after[0]?.markers ?? 0) < quotes) {
        const flat = linesToParagraph(segsOf(after));
        if (flat) leaving.add(flat);
        moved = flat ? [flat] : [];
      } else {
        moved = rebuildLazyLines(
          after.map((line) => ({ ...line, markers: line.markers - quotes })),
          0
        );
      }
      if (moved.length === 0) continue;
      // An mdast block, in the loose node shape the pass walks.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const blocks = moved as unknown as GroupTreeNode[];
      const data: ParagraphAttributes | undefined = para.data;
      if (data?.hProperties) {
        const { hProperties, ...rest } = data;
        const movedData: ParagraphAttributes = { hProperties };
        const last = lastParagraph({ type: `root`, children: blocks })?.para;
        if (last) last.data = movedData;
        para.data = rest;
      }
      if (kept) para.children = kept.children;
      else parent.children?.pop();
      children.splice(i + 1, 0, ...blocks);
    }
  };
  // The tree, in the loose node shape the pass walks.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  visit(root as GroupTreeNode, 0);
};
