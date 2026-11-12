// Recognition for tabbed content blocks, shared by the remark and Sätteri plugins: header lines (`% Label`) and their `>` bodies become `tabsList`/`tabsItem` nodes, which each engine then renders. It rewrites mdast in place, so a read-only engine runs it on a copy.
// This module performs heavy tree-rewriting across mdast/unist types that don't unify cleanly; type assertions bridging those boundaries are reviewed and intentional, so the rule is disabled file-wide rather than per-cast. Defensive optional chains on array[i] accesses are also kept because TS doesn't model index access as fallible.
/* oxlint-disable typescript/no-unsafe-type-assertion */
/* oxlint-disable typescript/no-unnecessary-condition */
import type {
  Root,
  Paragraph,
  Blockquote,
  PhrasingContent,
  BlockContent,
  DefinitionContent,
  RootContent
} from "mdast";
import type { Properties } from "hast";
import {
  blockquoteMarkers,
  endGroupsAtMarkers,
  headerLineContent,
  INDENTED_BLOCKS,
  itemContentColumn,
  keepQuoteAttributes,
  markerLevels,
  splitAtOpeningLine,
  splitSourceLines,
  linesToParagraph,
  paragraphProperties,
  paraToLines,
  paraToSourceLines,
  rebuildLazyLines,
  type MarkedLine
} from "./lazy.js";

// ── MDAST node types ──────────────────────────────────────────────────────────

/** A group of tabs at one depth, rendered as the tabs container. */
export interface TabsListNode {
  type: "tabsList";
  depth: number;
  containerClass?: string;
  groupId: string;
  /** The group's block id (see `tabsBlockId`), which names its radio inputs. `processTabs` sets it once the whole document is recognized, numbering the groups in document order, so it doesn't depend on the order an engine renders them in; it's empty until then. */
  blockId: string;
  children: TabsItemNode[];
  data?: { attrsRole?: string; hProperties?: Properties };
}

/** A tab's label, rendered as its `<label>`. */
export interface TabsLabelNode {
  type: "tabsLabel";
  children: PhrasingContent[];
}

/** One tab: its label (always the first child, so transforms that walk children reach it), panel body and nested tabs. */
export interface TabsItemNode {
  type: "tabsItem";
  depth: number;
  labelText: string; // plain text of the label as recognized, for the group id
  open: boolean;
  children: Array<
    TabsLabelNode | BlockContent | DefinitionContent | TabsListNode
  >;
  data?: {
    attrsRole?: string;
    attrsTitle?: PhrasingContent[];
    attrsItemTitle?: boolean;
    hProperties?: Properties;
    /** Set on a tab written one level deeper than the tab before it (`%%`): it's nested in that tab, but its body is written with that tab's `>` markers, not one more (see `markerLevels`). */
    sub?: boolean;
  };
}

// ── Header and ids ────────────────────────────────────────────────────────────

// Matches: %{1,6}+? label text  (prefix-plus form: %+ Label)
// Groups: 1=% string (depth), 2=+ (open marker, optional), 3=label text
const TAB_HEADER_RE = /^(%{1,6})(\+)? (.*)/;

interface ParsedTabHeader {
  depth: number;
  open: boolean;
  label: string;
}

const parseTabHeader = (line: string): ParsedTabHeader | null => {
  const m = TAB_HEADER_RE.exec(line);
  if (!m) return null;
  const [, percents = "", plus, label = ""] = m;
  return { depth: percents.length, open: plus === "+", label };
};

// djb2 hash — returns an unsigned 32-bit integer
const djb2 = (str: string): number => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h;
};

/** Strip a trailing attrs block like `{.class #id}` from plain label text, so attrs-consumed markers don't leak into `aria-label`. */
export const stripAttrs = (text: string): string =>
  text.replace(/\s*\{[^}]*\}\s*$/, "").trimEnd();

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");

// content-based: same label set → same id regardless of page position
const groupId = (labels: string[]): string => {
  const key = [...labels].map(slugify).sort().join("-");
  return djb2(key).toString(16);
};

/**
 * A group's block id, unique in its document even when label sets match: its group id with the group's index among the document's tab groups, counted in document order (each nested group after the group around it), so every engine counts the same groups the same way. It is not unique across documents: two documents rendered into one page give their Nth groups the same id when those have the same labels.
 */
export const tabsBlockId = (index: number, groupId: string): string =>
  "tabs-" + djb2(`${index}:${groupId}`).toString(16);

// ── Raw extraction types ──────────────────────────────────────────────────────

interface RawTab {
  depth: number;
  open: boolean;
  labelNodes: PhrasingContent[]; // inline nodes for the label
  labelText: string; // plain text for aria-label / data-tab
  body: Array<BlockContent | DefinitionContent>; // blockquote contents
  // Content after the tab's nested groups: headers in its explicit `> %` body that skip a level, kept as written.
  after?: Array<BlockContent | DefinitionContent>;
  // Attributes the parser read off the end of the header's paragraph, when the header ended it (Sätteri).
  hProperties?: Properties | undefined;
  // The header was written deeper than level one (`%%`), so the tab's body carries its parent tab's markers. A tab that is deeper only because its header is in an explicit `> %` body carries one more, and isn't one.
  sub?: boolean;
}

// ── Paragraph line splitting ──────────────────────────────────────────────────

/** The plain text of a tab label (text and inline code; other markup contributes its text, images nothing), for its group id and `aria-label`. */
export const tabLabelText = (nodes: PhrasingContent[]): string =>
  nodes
    .map((n) => {
      if (n.type === "text" || n.type === "inlineCode")
        return "value" in n ? n.value : "";
      if ("children" in n) return tabLabelText(n.children);
      return "";
    })
    .join("");

// ── Tab group extraction ──────────────────────────────────────────────────────

// Parse the % tab headers a paragraph node starts with. Returns null if its
// first line isn't one. A header that skips a depth level, or a line that
// isn't a header, ends the group, as it does in markdown-it: it and the lines
// after it are returned as `rest`, to be rendered as ordinary paragraphs after
// the tabs.
// requireDepthOne: if true, the first header must be depth 1 (top-level group start).
// If false, allows any starting depth (for continuation paragraphs).
const extractHeaderPara = (
  para: Paragraph,
  requireDepthOne = true,
  prevDepth = 0,
  sourceLines?: readonly string[]
): { tabs: RawTab[]; rest: PhrasingContent[][]; restLine: number } | null => {
  const lines = paraToLines(para);
  const tabs: RawTab[] = [];
  let currentDepth = prevDepth;

  for (const [index, line] of lines.entries()) {
    // A header's line, without the hard break that can't follow it.
    const lineSegs = headerLineContent(line, sourceLines);
    const first = lineSegs[0];
    const header = first?.type === "text" ? parseTabHeader(first.value) : null;

    const depth = header?.depth ?? 0;
    const open = header?.open ?? false;
    if (tabs.length === 0 && requireDepthOne && depth !== 1) return null;
    if (!header || depth > currentDepth + 1) {
      return tabs.length > 0
        ? {
            tabs,
            rest: lines.slice(index),
            restLine: (para.position?.start.line ?? 1) + index
          }
        : null;
    }
    currentDepth = depth;

    const labelText = header.label;
    const labelNodes: PhrasingContent[] = labelText
      ? [{ type: "text", value: labelText }, ...lineSegs.slice(1)]
      : lineSegs.slice(1);

    tabs.push({
      depth,
      open,
      labelNodes,
      labelText: tabLabelText(labelNodes),
      body: [],
      ...(depth > 1 ? { sub: true } : {}),
      ...(index === lines.length - 1
        ? { hProperties: paragraphProperties(para) }
        : {})
    });
  }

  return tabs.length > 0 ? { tabs, rest: [], restLine: 0 } : null;
};

// Lines left over after a group ends become ordinary paragraphs, split before
// every line that opens a new group (a depth-1 header), so the main loop can
// start that group. Positions follow the source lines (paragraph lines map 1:1
// to source lines) because a group at the root ends at a blank line.
const splitAtGroupStarts = (
  lines: PhrasingContent[][],
  firstLine: number
): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  let start = 0;
  const flush = (end: number): void => {
    const para = linesToParagraph(lines.slice(start, end));
    if (!para) return;
    para.position = {
      start: { line: firstLine + start, column: 1 },
      end: { line: firstLine + end - 1, column: 1 }
    };
    paragraphs.push(para);
  };
  lines.forEach((line, index) => {
    const first = line[0];
    const opens =
      first?.type === "text" && parseTabHeader(first.value)?.depth === 1;
    if (opens && index > start) {
      flush(index);
      start = index;
    }
  });
  flush(lines.length);
  return paragraphs;
};

// Split a blockquote node into segments separated by % tab header lines.
// Each segment is { header: RawTab | null, body: blockquote-like children }.
//
// Remark absorbs adjacent non-blank lines into a blockquote, so:
//   % Tab One
//   > Content for tab one.
//   % Tab Two
//   > Content for tab two.
//
// Produces: paragraph("% Tab One") + blockquote containing:
//   paragraph("Content for tab one.\n% Tab Two\nContent for tab two.")
//
// We need to split that paragraph on lines matching tab headers, then
// reconstruct the body content for each segment.
interface BQSegment {
  header: RawTab | null; // null means pre-header content (goes to prev tab)
  body: Array<BlockContent | DefinitionContent>;
  // true when this blockquote was written with explicit `> %` nesting (multiple
  // block children) rather than being the standard absorbed-tabs pattern where
  // remark collapses consecutive `% Tab\n> body` lines into one blockquote.
  // Used to apply a depth offset and to unwrap nested blockquote bodies.
  explicit: boolean;
  // With the source: the `>` markers of the header's line, and the body lines after it with theirs, for headers lazily continued into a nested paragraph.
  markers?: number;
  lines: MarkedLine[];
  // The header's line as written, for a header that skips a level and stays text.
  line?: PhrasingContent[];
  // The group ends here: `lines` are a line that is neither a header nor written with the panel's markers, and the paragraph's lines after it; `body`, the blockquote's blocks after that paragraph.
  ends?: boolean;
}

// A blockquote is "explicit" (`> % Label` nesting) when at least one of its
// direct paragraph children starts with a tab header. The absorbed pattern
// (remark collapsing consecutive `% Tab\n> body` lines into one blockquote)
// never produces standalone header paragraphs — headers are only embedded
// inside multi-line text nodes.
const isExplicitBQ = (bq: Blockquote): boolean =>
  bq.children.some((child) => {
    if (child.type !== "paragraph") return false;
    const first = child.children[0];
    return (
      first?.type === "text" &&
      parseTabHeader(first.value.split("\n")[0] ?? "") !== null
    );
  });

// Walk to the deepest last child of a node and return its paragraph if one of
// its lines is a tab header: the first such header, the paragraph truncated
// before it, and the lines after it (which belong to the new tab, and may hold
// further headers). Returns null if the paragraph has no tab header line.
// This handles cases where remark plugins (e.g. remarkDefinitionList) transform
// absorbed paragraphs into custom nodes — the trailing "% Code" line ends up
// inside a nested paragraph rather than at the blockquote's top level.
// The `>` markers of each line of a paragraph, read from the source line the line is written on (not the paragraph's first line plus the line's index: inline content that spans lines keeps them together as one); `undefined` without the source, or when a line's place in it isn't known.
const lineMarkers = (
  para: Paragraph,
  sourceLines?: readonly string[]
): number[] | undefined =>
  sourceLines
    ? paraToSourceLines(para, sourceLines)?.map(({ markers }) => markers)
    : undefined;

const extractTrailingTabHeader = (
  node: BlockContent | DefinitionContent,
  sourceLines?: readonly string[]
): {
  header: RawTab;
  truncatedPara: Paragraph | null;
  rest: PhrasingContent[][];
  path: Array<BlockContent | DefinitionContent>;
  // The `>` markers of each of the paragraph's lines, when the source places them.
  markers: number[] | undefined;
  at: number;
  line: PhrasingContent[];
} | null => {
  // Walk to the deepest last child that is a paragraph
  const path: Array<BlockContent | DefinitionContent> = [];
  let current: BlockContent | DefinitionContent = node;
  while ("children" in current && current.children.length > 0) {
    const last = current.children[current.children.length - 1] as
      | BlockContent
      | DefinitionContent;
    if (last.type === "paragraph") {
      path.push(current);
      // Find the first line of this paragraph that is a tab header. A nested
      // blockquote can lazily absorb a header line and the body lines after it.
      const lines = paraToLines(last, sourceLines);
      const at = lines.findIndex(
        (line) => line[0]?.type === "text" && parseTabHeader(line[0].value)
      );
      if (at === -1) return null;
      const headerLine = headerLineContent(lines[at] ?? [], sourceLines);
      const first = headerLine[0];
      const header =
        first?.type === "text" ? parseTabHeader(first.value) : null;
      if (!header) return null;
      const labelText = header.label;
      const labelNodes: PhrasingContent[] = labelText
        ? [{ type: "text", value: labelText }, ...headerLine.slice(1)]
        : headerLine.slice(1);
      const rawTab: RawTab = {
        depth: header.depth,
        open: header.open,
        labelNodes,
        labelText: tabLabelText(labelNodes),
        body: [],
        ...(header.depth > 1 ? { sub: true } : {}),
        ...(at === lines.length - 1
          ? { hProperties: paragraphProperties(last) }
          : {})
      };
      const truncatedPara = linesToParagraph(lines.slice(0, at), sourceLines);
      return {
        header: rawTab,
        truncatedPara,
        rest: lines.slice(at + 1),
        path,
        markers: lineMarkers(last, sourceLines),
        at,
        line: lines[at] ?? []
      };
    }
    if (!("children" in last)) break;
    path.push(current);
    current = last;
  }
  return null;
};

const splitBlockquote = (
  bq: Blockquote,
  explicit: boolean,
  sourceLines?: readonly string[],
  // Whether a line that leaves the panel without being a header ends the group (for the bodies of a group's own tabs).
  endAtUnmarked = false
): BQSegment[] => {
  const segments: BQSegment[] = [];
  // Set once such a line has ended the group: what follows is content after it, not tabs.
  let ended = false;
  let currentSegment: BQSegment = {
    header: null,
    body: [],
    explicit,
    lines: []
  };
  // The `>` markers of a plain panel's own lines: a header written with them is the panel's content (it can start a group of its own there), as markdown-it reads the panel; only one written outside the panel starts the next tab. An explicit panel (`> % Label`) places its headers by their markers itself.
  const base =
    sourceLines && !explicit ? blockquoteMarkers(bq, sourceLines) : undefined;

  // Split paragraph lines on tab header lines: body lines accumulate into the
  // current segment, and each header starts a new one. `markersOf` gives a
  // line's `>` markers when the source is known.
  const splitLines = (
    lines: PhrasingContent[][],
    markersOf?: (index: number) => number,
    para?: Paragraph,
    // Whether the lines' paragraph is the last block of the blockquote.
    last = true
  ): void => {
    let bodyLines: PhrasingContent[][] = [];
    // The header a line is, when it's written outside the panel.
    const headerAt = (index: number): ParsedTabHeader | null => {
      const first = headerLineContent(lines[index] ?? [], sourceLines)[0];
      const outsidePanel =
        !markersOf || base === undefined || markersOf(index) < base;
      return first?.type === "text" && outsidePanel
        ? parseTabHeader(first.value)
        : null;
    };

    for (const [index, line] of lines.entries()) {
      if (ended) {
        if (markersOf)
          currentSegment.lines.push({ segs: line, markers: markersOf(index) });
        continue;
      }
      // A header's line, without the hard break that can't follow it.
      const lineSegs = headerLineContent(line, sourceLines);
      const header = headerAt(index);
      if (header) {
        // Flush accumulated body lines into current segment
        if (bodyLines.length > 0) {
          const bodyPara = linesToParagraph(bodyLines, sourceLines);
          if (bodyPara) currentSegment.body.push(bodyPara);
          bodyLines = [];
        }

        // Save current segment, start a new one
        segments.push(currentSegment);

        const labelText = header.label;
        const labelNodes: PhrasingContent[] = labelText
          ? [{ type: "text", value: labelText }, ...lineSegs.slice(1)]
          : lineSegs.slice(1);

        currentSegment = {
          header: {
            depth: header.depth,
            open: header.open,
            labelNodes,
            labelText: tabLabelText(labelNodes),
            body: [],
            ...(header.depth > 1 ? { sub: true } : {}),
            ...(para && index === lines.length - 1
              ? { hProperties: paragraphProperties(para) }
              : {})
          },
          body: [],
          explicit,
          lines: [],
          line,
          ...(markersOf ? { markers: markersOf(index) } : {})
        };
        continue;
      }
      // A line that is neither a header nor written with the panel's markers ends the group, as it does in markdown-it. Here, that's one the pass that ends groups at their markers (`endGroupsAtMarkers`) doesn't reach: the first line after a header (that pass reads a paragraph from its second line), a line with a header after it (it isn't in the group's last panel then), or a line with a block after its paragraph (it isn't in the panel's last paragraph). The other such lines are left to that pass.
      if (
        endAtUnmarked &&
        markersOf &&
        base !== undefined &&
        markersOf(index) < base &&
        (bodyLines.length === 0 ||
          !last ||
          lines.some((_, later) => later > index && headerAt(later)))
      ) {
        const bodyPara = linesToParagraph(bodyLines, sourceLines);
        if (bodyPara) currentSegment.body.push(bodyPara);
        bodyLines = [];
        segments.push(currentSegment);
        currentSegment = {
          header: null,
          body: [],
          explicit,
          lines: [{ segs: line, markers: markersOf(index) }],
          ends: true
        };
        ended = true;
        continue;
      }
      bodyLines.push(line);
      if (markersOf) {
        currentSegment.lines.push({
          segs: line,
          markers: markersOf(index)
        });
      }
    }

    // Flush remaining body lines. They end the paragraph, so they keep its
    // data: attributes the parser read from its end (Sätteri's run before tabs).
    if (bodyLines.length > 0) {
      const bodyPara = linesToParagraph(bodyLines);
      if (bodyPara && para?.data) bodyPara.data = para.data;
      if (bodyPara) currentSegment.body.push(bodyPara);
    }
  };

  for (const [childIndex, child] of bq.children.entries()) {
    const last = childIndex === bq.children.length - 1;
    // After the group has ended, the blockquote's other blocks follow it as they are.
    if (ended) {
      currentSegment.body.push(child);
      continue;
    }
    if (child.type !== "paragraph") {
      // For non-paragraph children (e.g. defList from remarkDefinitionList),
      // check if the deepest last-child paragraph has a trailing tab header.
      // Remark may have absorbed a "% NextTab" line into that nested paragraph.
      const extracted = extractTrailingTabHeader(child, sourceLines);
      if (extracted) {
        // Clone the child with the trailing header line removed from its nested paragraph
        const cloned = JSON.parse(JSON.stringify(child)) as
          | BlockContent
          | DefinitionContent;
        // Navigate to the deepest last child and replace the paragraph.
        // Tree walking through heterogeneous mdast Parent shapes — no narrow
        // type fits all the intermediate nodes we descend through.
        interface ParentLike {
          children: ParentLike[];
        }
        let target: ParentLike = cloned as unknown as ParentLike;
        for (let pi = 1; pi < extracted.path.length; pi++) {
          target = target.children[target.children.length - 1]!;
        }
        const deepestParent = target as unknown as { children: unknown[] };
        if (extracted.truncatedPara) {
          deepestParent.children[deepestParent.children.length - 1] =
            extracted.truncatedPara;
        } else {
          deepestParent.children.splice(deepestParent.children.length - 1, 1);
        }
        currentSegment.body.push(cloned);
        // Start a new segment for the extracted tab header
        segments.push(currentSegment);
        const { markers, at } = extracted;
        const markersOf = markers
          ? (index: number): number => markers[index] ?? 0
          : undefined;
        currentSegment = {
          header: extracted.header,
          body: [],
          explicit,
          lines: [],
          line: extracted.line,
          ...(markersOf ? { markers: markersOf(at) } : {})
        };
        splitLines(
          extracted.rest,
          markersOf ? (index): number => markersOf(at + 1 + index) : undefined,
          undefined,
          last
        );
      } else {
        currentSegment.body.push(child);
      }
      continue;
    }

    // Check if this paragraph contains tab headers mixed with body text
    const markers = lineMarkers(child, sourceLines);
    splitLines(
      paraToLines(child, sourceLines),
      markers ? (index): number => markers[index] ?? 0 : undefined,
      child,
      last
    );
  }

  segments.push(currentSegment);
  return segments;
};

// Whether a plain panel's last paragraph (the deepest one a line can lazily continue) holds a line that is neither a header nor written with the panel's markers. `splitBlockquote` leaves such a line in the body for the pass that ends groups at their markers to move, but the group has ended there all the same, as it does in markdown-it: nothing after the blockquote continues it. Steps report the same from their `splitBlockquote` (`ended`).
const endsAtUnmarkedLine = (
  bq: Blockquote,
  sourceLines: readonly string[]
): boolean => {
  const base = blockquoteMarkers(bq, sourceLines);
  let last: { type: string; children?: unknown[] } | undefined = bq;
  while (last && last.type !== "paragraph")
    last = last.children?.at(-1) as typeof last;
  const lines = last && paraToSourceLines(last as Paragraph, sourceLines);
  if (base === undefined || !lines) return false;
  return lines.some(({ segs, markers }, index) => {
    const first = headerLineContent(segs, sourceLines)[0];
    return (
      index > 0 &&
      markers < base &&
      !(first?.type === "text" && parseTabHeader(first.value))
    );
  });
};

// The content that a header which skips a level, and what follows it, stand for
// once they are not tabs: the header line and the lines and blocks after it, as
// markdown-it reads them. CommonMark lazily continued them into a paragraph; with
// the source, their `>` markers (relative to `level`, the markers of the content
// they belong to) rebuild the blockquotes they were written in. Their other
// blocks follow: in the last quote when they were inside a blockquote the header
// line is outside of (`quoted`), else beside the rest.
const afterSkip = (
  segments: BQSegment[],
  level: number | undefined,
  quoted: boolean
): Array<BlockContent | DefinitionContent> => {
  const lines: MarkedLine[] = [];
  const blocks: Array<BlockContent | DefinitionContent> = [];
  for (const seg of segments) {
    if (level === undefined || seg.markers === undefined) {
      // Without the source: the header line, then the segment's body quoted.
      if (seg.line) lines.push({ segs: seg.line, markers: 0 });
      blocks.push(...seg.body);
      continue;
    }
    if (seg.line) lines.push({ segs: seg.line, markers: seg.markers - level });
    lines.push(
      ...seg.lines.map((line) => ({ ...line, markers: line.markers - level }))
    );
    blocks.push(...seg.body.filter((block) => block.type !== "paragraph"));
  }
  const content = rebuildLazyLines(lines, 0);
  if (blocks.length > 0 && !quoted) {
    content.push(...blocks);
  } else if (blocks.length > 0) {
    const last = content.at(-1);
    if (last?.type === "blockquote") last.children.push(...blocks);
    else
      content.push({
        type: "blockquote",
        children: blocks
      });
  }
  return content;
};

// ── Tree builder ──────────────────────────────────────────────────────────────

const buildTree = (
  rawTabs: RawTab[],
  targetDepth: number,
  start: number,
  end: number,
  containerClass: string
): TabsListNode => {
  const depthLabels = rawTabs
    .slice(start, end)
    .filter((t) => t.depth === targetDepth)
    .map((t) => stripAttrs(t.labelText));

  const gId = groupId(depthLabels);

  // Absolute index of the first %+ tab at this depth (-1 if none)
  const explicitOpenIdx = rawTabs
    .slice(start, end)
    .findIndex((t) => t.depth === targetDepth && t.open);
  const explicitOpenAbsIdx =
    explicitOpenIdx >= 0 ? start + explicitOpenIdx : -1;

  const items: TabsItemNode[] = [];
  let tabCounter = 0;
  let i = start;

  while (i < end) {
    const raw = rawTabs[i];
    if (!raw) break;
    if (raw.depth !== targetDepth) {
      i++;
      continue;
    }

    let childEnd = i + 1;
    while (childEnd < end && (rawTabs[childEnd]?.depth ?? 0) > targetDepth)
      childEnd++;

    // First %+ wins; if none, first tab is open
    const isOpen =
      explicitOpenAbsIdx >= 0 ? i === explicitOpenAbsIdx : tabCounter === 0;
    // The label node shares `labelNodes` with `attrsTitle`, so attrs trimming one trims the other.
    const bodyChildren: TabsItemNode["children"] = [
      { type: "tabsLabel", children: raw.labelNodes },
      ...raw.body
    ];

    const hasDeeper = rawTabs
      .slice(i + 1, childEnd)
      .some((t) => t.depth === targetDepth + 1);

    if (hasDeeper) {
      const nested = buildTree(
        rawTabs,
        targetDepth + 1,
        i + 1,
        childEnd,
        containerClass
      );
      nested.containerClass = containerClass;
      bodyChildren.push(nested);
    }
    bodyChildren.push(...(raw.after ?? []));

    items.push({
      type: "tabsItem",
      depth: targetDepth,
      labelText: raw.labelText,
      open: isOpen,
      children: bodyChildren,
      data: {
        attrsRole: "containerItem",
        attrsTitle: raw.labelNodes,
        attrsItemTitle: true,
        hProperties: { ...raw.hProperties },
        ...(raw.sub ? { sub: true } : {})
      }
    });

    tabCounter++;
    i = childEnd;
  }

  return {
    type: "tabsList",
    depth: targetDepth,
    groupId: gId,
    blockId: "",
    children: items,
    data: { attrsRole: "container", hProperties: {} }
  };
};

// ── Remark plugin ─────────────────────────────────────────────────────────────

// Process all tab groups found in a children array in-place.
// Used at root level and recursively inside any parent node's children.
// checkBlankLines: when false, skip the line-gap termination check (for nested contexts
// where blank lines inside blockquotes produce position gaps but are still part of the group).
export const processTabsInChildren = (
  children: Array<BlockContent | DefinitionContent | RootContent>,
  containerClass: string,
  checkBlankLines = true,
  sourceLines?: readonly string[],
  quotes = 0,
  parentType = "root",
  // Where the content of the list item the children are in starts (see `itemContentColumn`).
  column?: number
): void => {
  const newChildren: typeof children = [];
  let i = 0;

  while (i < children.length) {
    const node = children[i];
    if (!node) break;

    // A tab header interrupts the paragraph before it, as markdown-it's block rule does, when it's written at the paragraph's own level (its `>` markers). In a list item, a header line may instead be one CommonMark lazily continued, written short of the item's content: only one written in the item interrupts. In a definition, where the content's column isn't known, they are left as they are.
    if (
      node.type === "paragraph" &&
      sourceLines &&
      (column !== undefined || !INDENTED_BLOCKS.has(parentType))
    ) {
      const split = splitAtOpeningLine(
        node,
        sourceLines,
        quotes,
        (text) => parseTabHeader(text)?.depth === 1,
        column
      );
      if (split) {
        children.splice(i, 1, ...split);
        continue;
      }
    }

    if (node.type === "paragraph") {
      const headerPara = extractHeaderPara(node, true, 0, sourceLines);

      if (headerPara) {
        const rawTabs: RawTab[] = [...headerPara.tabs];
        // A group always starts with at least one tab.
        const lastTab = (): RawTab => rawTabs[rawTabs.length - 1]!;
        // Lines left over after a depth-skipping header end the group.
        let rest = headerPara.rest;
        let restLine = headerPara.restLine;
        let j = i + 1;
        let currentTabIdx = rawTabs.length - 1;
        let prevEndLine = node.position?.end.line ?? 0;
        // Attributes for the group itself (see where a blockquote's are read).
        let listProperties: Properties | undefined;

        while (rest.length === 0 && j < children.length) {
          const sibling = children[j];
          if (!sibling) break;
          const siblingStartLine =
            (sibling as { position?: { start: { line: number } } }).position
              ?.start.line ?? prevEndLine + 1;

          if (checkBlankLines && siblingStartLine > prevEndLine + 1) break;

          if (sibling.type === "blockquote") {
            const bq = sibling;
            const explicit = isExplicitBQ(bq);
            const segments = splitBlockquote(bq, explicit, sourceLines, true);
            // The `>` markers of the owning tab's body lines: an inner header written with fewer belongs outside it.
            const base =
              explicit && sourceLines
                ? blockquoteMarkers(bq, sourceLines)
                : undefined;

            const firstSeg = segments[0];
            if (firstSeg?.header === null) {
              rawTabs[currentTabIdx]?.body.push(...firstSeg.body);
            }

            // Explicit blockquotes (`> % Label` nesting) have their headers
            // implicitly one level deeper than the owning tab. Apply a depth
            // offset so they nest correctly.
            // Absorbed blockquotes (standard `% Tab\n> body` pattern) keep
            // literal depths — remark collapses them into a single paragraph child.
            const depthOffset = explicit ? lastTab().depth : 0;
            // The tab whose body this blockquote is.
            const owner = lastTab();
            // Content after the group when a header ends it.
            let ending: Array<BlockContent | DefinitionContent> | null = null;

            for (const [index, seg] of segments.slice(1).entries()) {
              if (seg.ends) {
                // The lines that ended the group follow it, rebuilt from their markers over those of the content around the group (one fewer than this blockquote's), with the blockquote's later blocks still quoted.
                const level =
                  (blockquoteMarkers(bq, sourceLines ?? []) ?? 1) - 1;
                ending = rebuildLazyLines(
                  seg.lines.map((line) => ({
                    ...line,
                    markers: line.markers - level
                  })),
                  0
                );
                const last = ending.at(-1);
                if (seg.body.length === 0) break;
                if (last?.type === "blockquote")
                  last.children.push(...seg.body);
                else ending.push({ type: "blockquote", children: seg.body });
                break;
              }
              if (!seg.header) continue;

              // A header remark absorbed into this body from outside it (its line has
              // fewer `>` markers than the body's) is an outer-level tab: it keeps the
              // depth it was written with, its absorbed lines are its body, rebuilt
              // from their markers, and the blocks after them are its body as written.
              const markers = seg.markers;
              if (
                explicit &&
                markers !== undefined &&
                base !== undefined &&
                markers < base
              ) {
                if (seg.header.depth > lastTab().depth + 1) continue;
                const relative = seg.lines.map((line) => ({
                  ...line,
                  markers: line.markers - (markers + 1)
                }));
                seg.header.body.push(
                  ...rebuildLazyLines(relative, 0),
                  ...seg.body.slice(seg.lines.length > 0 ? 1 : 0)
                );
                rawTabs.push(seg.header);
                currentTabIdx = rawTabs.length - 1;
                continue;
              }

              const adjustedDepth = depthOffset + seg.header.depth;
              const prevDepth = lastTab().depth;
              if (adjustedDepth > prevDepth + 1) {
                if (explicit) {
                  // In an explicit `> %` body, a header that skips a level is not a tab: it
                  // and its body stay in the owning tab's panel as written, after any group
                  // nested there, as markdown-it renders them.
                  owner.after = [
                    ...(owner.after ?? []),
                    ...afterSkip([seg], base, false)
                  ];
                  continue;
                }
                // In a group of plain `>` bodies, a header that skips a level ends the
                // group: it and everything after it in this blockquote follow the group as
                // ordinary content.
                // The header line is outside the blockquote, one `>` short of its own.
                const quoteMarkers = sourceLines
                  ? blockquoteMarkers(bq, sourceLines)
                  : undefined;
                ending = afterSkip(
                  segments.slice(index + 1),
                  quoteMarkers === undefined ? undefined : quoteMarkers - 1,
                  true
                );
                break;
              }

              seg.header.depth = adjustedDepth;

              if (explicit) {
                // For explicit `> %` blockquotes, body items are wrapped in a
                // nested `> >` blockquote. Unwrap each nested blockquote:
                // - Non-explicit (absorbed) inner BQs are re-split to extract
                //   tab headers that remark collapsed into a single paragraph.
                // - Explicit inner BQs use their children directly.
                //
                // "Escaped" segments: when remark absorbs an outer-level tab header
                // (e.g. `% Code` at root depth) into an inner BQ paragraph, the tab's
                // body node (code fence etc.) is hoisted to the outer BQ as a direct
                // child after that inner BQ. Re-split segments with an empty body had
                // their body hoisted — they are outer-level siblings, not inner children.
                // Subsequent non-blockquote nodes in seg.body belong to those escaped tabs.
                const deferredInnerSegs: BQSegment[] = [];
                // Tracks which re-split segments have empty bodies (body hoisted to outer BQ)
                const escapedSegs: RawTab[] = [];

                for (const b of seg.body) {
                  if (b.type !== "blockquote") {
                    // Non-BQ outer sibling — belongs to the first escaped seg's body
                    const escaped = escapedSegs.at(-1);
                    if (escaped) {
                      escaped.body.push(b);
                    } else {
                      seg.header.body.push(b);
                    }
                    continue;
                  }
                  const innerBq = b;
                  if (!isExplicitBQ(innerBq)) {
                    // Re-split absorbed inner blockquote to extract sibling headers
                    const innerSegs = splitBlockquote(
                      innerBq,
                      false,
                      sourceLines
                    );
                    const innerFirst = innerSegs[0];
                    if (innerFirst?.header === null) {
                      seg.header.body.push(...innerFirst.body);
                    }
                    for (const innerSeg of innerSegs.slice(1)) {
                      if (!innerSeg.header) continue;
                      // An outer-level header that remark absorbed into this inner BQ is an
                      // escaped tab. With the source, its line has fewer `>` markers than the
                      // owning tab's body: it keeps the depth it was written with, and the
                      // lines absorbed after it are its body, rebuilt from their markers.
                      // Without, a re-split segment with no body is taken as escaped (its
                      // body was hoisted to the outer BQ as a direct child) at depthOffset.
                      const markers = innerSeg.markers;
                      if (markers !== undefined && base !== undefined) {
                        if (markers < base) {
                          const relative = innerSeg.lines.map((line) => ({
                            ...line,
                            markers: line.markers - (markers + 1)
                          }));
                          innerSeg.header.body.push(
                            ...rebuildLazyLines(relative, 0)
                          );
                          escapedSegs.push(innerSeg.header);
                          deferredInnerSegs.push(innerSeg);
                          continue;
                        }
                      } else if (innerSeg.body.length === 0) {
                        innerSeg.header.depth = depthOffset;
                        escapedSegs.push(innerSeg.header);
                        deferredInnerSegs.push(innerSeg);
                        continue;
                      }
                      const tentativeDepth =
                        depthOffset + innerSeg.header.depth;
                      const innerPrevDepth = lastTab().depth;
                      if (tentativeDepth > innerPrevDepth + 1) continue;
                      innerSeg.header.depth = tentativeDepth;
                      innerSeg.header.body.push(...innerSeg.body);
                      deferredInnerSegs.push(innerSeg);
                    }
                  } else {
                    // Explicit inner blockquote — use children directly
                    seg.header.body.push(...innerBq.children);
                  }
                }
                // Push the current seg first, then any deferred inner siblings
                rawTabs.push(seg.header);
                currentTabIdx = rawTabs.length - 1;
                for (const innerSeg of deferredInnerSegs) {
                  if (!innerSeg.header) continue;
                  rawTabs.push(innerSeg.header);
                  currentTabIdx = rawTabs.length - 1;
                }
              } else {
                seg.header.body.push(...seg.body);
                rawTabs.push(seg.header);
                currentTabIdx = rawTabs.length - 1;
              }
            }

            prevEndLine = sibling.position?.end.line ?? prevEndLine;
            j++;
            // Attributes on the blockquote itself (Sätteri) come from a block on a line of its own, written after the panel without its `>`. That line ends the tabs, and its attributes are the group's, as the attrs plugins of the other engines place them, unless a line in the blockquote had already ended the group: then they are written after that line, and are the last block's after the group.
            const quoteProperties = paragraphProperties(
              bq as unknown as Paragraph
            );
            if (ending) {
              const lastBlock = ending.at(-1);
              if (quoteProperties && lastBlock)
                lastBlock.data = {
                  ...lastBlock.data,
                  hProperties: { ...quoteProperties }
                } as typeof lastBlock.data;
              children.splice(j, 0, ...ending);
              break;
            }
            // A line left in the panel for the end-of-group pass ended the group too (a header after a blank line starts a new one): the attributes go where that pass puts the line's blocks.
            if (
              !explicit &&
              sourceLines &&
              endsAtUnmarkedLine(bq, sourceLines)
            ) {
              if (quoteProperties)
                keepQuoteAttributes(lastTab().body, quoteProperties);
              break;
            }
            if (quoteProperties) {
              listProperties = quoteProperties;
              break;
            }
          } else if (sibling.type === "paragraph") {
            const prevDepth = lastTab().depth;
            const contHeaders = extractHeaderPara(
              sibling,
              false,
              prevDepth,
              sourceLines
            );
            if (contHeaders) {
              rawTabs.push(...contHeaders.tabs);
              rest = contHeaders.rest;
              restLine = contHeaders.restLine;
              currentTabIdx = rawTabs.length - 1;
              prevEndLine = sibling.position?.end.line ?? prevEndLine;
              j++;
              continue;
            }
            break;
          } else {
            break;
          }
        }

        const list = buildTree(rawTabs, 1, 0, rawTabs.length, containerClass);
        list.containerClass = containerClass;
        if (listProperties)
          list.data = { ...list.data, hProperties: { ...listProperties } };
        newChildren.push(list as unknown as RootContent);
        children.splice(j, 0, ...splitAtGroupStarts(rest, restLine));
        i = j;
        continue;
      }
    }

    newChildren.push(node);
    i++;
  }

  children.splice(0, children.length, ...newChildren);
};

interface Container {
  type?: string;
  children?: unknown[];
}

/**
 * Recognize every tab group in the tree: at the root, then inside every container (step bodies, list items, other tabs' panels). Blank-line checks only apply at the root: blank lines inside a blockquote leave position gaps that would wrongly end a group once its content has been lifted out of the blockquote. With the document's `source`, a tab header that CommonMark lazily continued into a nested panel is placed by its `>` markers, as markdown-it reads it.
 */
export const processTabs = (
  root: Root,
  containerClass: string,
  source?: string
): void => {
  const sourceLines =
    source === undefined ? undefined : splitSourceLines(source);
  const walk = (node: Container, quotes: number): void => {
    if (!Array.isArray(node.children) || node.children.length === 0) return;
    const inner = quotes + markerLevels(node);
    processTabsInChildren(
      node.children as Array<BlockContent | DefinitionContent>,
      containerClass,
      false,
      sourceLines,
      inner,
      node.type,
      itemContentColumn(node)
    );
    for (const child of node.children) walk(child as Container, inner);
  };
  processTabsInChildren(root.children, containerClass, true, sourceLines);
  for (const child of root.children) walk(child, 0);
  if (sourceLines) endGroupsAtMarkers(root, sourceLines, `tabsList`);
  // Number the groups where they are in the document (each nested group after the group around it), not as an engine renders them: remark renders footnote definitions last, wherever they're written.
  let groups = 0;
  const number = (node: Container): void => {
    if (node.type === `tabsList`) {
      const list = node as TabsListNode;
      list.blockId = tabsBlockId(groups++, list.groupId);
    }
    if (Array.isArray(node.children))
      for (const child of node.children) number(child as Container);
  };
  number(root);
};
