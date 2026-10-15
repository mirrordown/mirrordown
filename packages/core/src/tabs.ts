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
  markerCount,
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
 * A group's block id, unique on the page even when label sets match: its group id with the group's index among the document's tab groups, counted in the order they open (each nested group after the group around it), so every engine counts the same groups the same way.
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
}

// ── Paragraph line splitting ──────────────────────────────────────────────────

// Split a paragraph's inline children into lines by text "\n" boundaries.
const paraToLines = (para: Paragraph): PhrasingContent[][] => {
  type Seg = PhrasingContent | null;
  const segs: Seg[] = [];

  for (const child of para.children) {
    if (child.type === "text") {
      const parts = child.value.split("\n");
      for (const [p, part] of parts.entries()) {
        if (p > 0) segs.push(null);
        if (part !== "") segs.push({ type: "text", value: part });
      }
    } else if (child.type === "break") {
      segs.push(null);
    } else {
      segs.push(child);
    }
  }

  const lines: PhrasingContent[][] = [[]];
  for (const seg of segs) {
    if (seg === null) lines.push([]);
    else lines.at(-1)?.push(seg);
  }
  return lines;
};

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

// Parse a paragraph node that consists entirely of % tab headers (no body
// content). Returns null if the paragraph isn't all headers. A header that
// skips a depth level ends the group: it and the lines after it are returned
// as `rest`, to be rendered as an ordinary paragraph after the tabs.
// requireDepthOne: if true, the first header must be depth 1 (top-level group start).
// If false, allows any starting depth (for continuation paragraphs).
const extractHeaderPara = (
  para: Paragraph,
  requireDepthOne = true,
  prevDepth = 0
): { tabs: RawTab[]; rest: PhrasingContent[][]; restLine: number } | null => {
  const lines = paraToLines(para);
  const tabs: RawTab[] = [];
  let currentDepth = prevDepth;

  for (const [index, lineSegs] of lines.entries()) {
    const first = lineSegs[0];
    if (first?.type !== "text") return null;

    const header = parseTabHeader(first.value);
    if (!header) return null;

    const { depth, open } = header;
    if (tabs.length === 0 && requireDepthOne && depth !== 1) return null;
    if (depth > currentDepth + 1) {
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
      body: []
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
    const para = buildParagraph(lines.slice(start, end));
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
const extractTrailingTabHeader = (
  node: BlockContent | DefinitionContent
): {
  header: RawTab;
  truncatedPara: Paragraph | null;
  rest: PhrasingContent[][];
  path: Array<BlockContent | DefinitionContent>;
  start: number | undefined;
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
      const lines = paraToLines(last);
      const at = lines.findIndex(
        (line) => line[0]?.type === "text" && parseTabHeader(line[0].value)
      );
      if (at === -1) return null;
      const headerLine = lines[at] ?? [];
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
        body: []
      };
      const truncatedPara = buildParagraph(lines.slice(0, at));
      return {
        header: rawTab,
        truncatedPara,
        rest: lines.slice(at + 1),
        path,
        start: last.position?.start.line,
        at,
        line: headerLine
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
  sourceLines?: readonly string[]
): BQSegment[] => {
  const segments: BQSegment[] = [];
  let currentSegment: BQSegment = {
    header: null,
    body: [],
    explicit,
    lines: []
  };

  // Split paragraph lines on tab header lines: body lines accumulate into the
  // current segment, and each header starts a new one. `markersOf` gives a
  // line's `>` markers when the source is known.
  const splitLines = (
    lines: PhrasingContent[][],
    markersOf?: (index: number) => number
  ): void => {
    let bodyLines: PhrasingContent[][] = [];

    for (const [index, lineSegs] of lines.entries()) {
      const first = lineSegs[0];
      if (first?.type === "text") {
        const header = parseTabHeader(first.value);
        if (header) {
          // Flush accumulated body lines into current segment
          if (bodyLines.length > 0) {
            const bodyPara = buildParagraph(bodyLines);
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
              body: []
            },
            body: [],
            explicit,
            lines: [],
            line: lineSegs,
            ...(markersOf ? { markers: markersOf(index) } : {})
          };
          continue;
        }
      }
      bodyLines.push(lineSegs);
      if (markersOf) {
        currentSegment.lines.push({
          segs: lineSegs,
          markers: markersOf(index)
        });
      }
    }

    // Flush remaining body lines
    if (bodyLines.length > 0) {
      const bodyPara = buildParagraph(bodyLines);
      if (bodyPara) currentSegment.body.push(bodyPara);
    }
  };

  for (const child of bq.children) {
    if (child.type !== "paragraph") {
      // For non-paragraph children (e.g. defList from remarkDefinitionList),
      // check if the deepest last-child paragraph has a trailing tab header.
      // Remark may have absorbed a "% NextTab" line into that nested paragraph.
      const extracted = extractTrailingTabHeader(child);
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
        const { start, at } = extracted;
        const markersOf =
          sourceLines && start !== undefined
            ? (index: number): number =>
                markerCount(sourceLines[start - 1 + index] ?? "")
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
          markersOf ? (index): number => markersOf(at + 1 + index) : undefined
        );
      } else {
        currentSegment.body.push(child);
      }
      continue;
    }

    // Check if this paragraph contains tab headers mixed with body text
    const start = child.position?.start.line;
    splitLines(
      paraToLines(child),
      sourceLines && start !== undefined
        ? (index): number => markerCount(sourceLines[start - 1 + index] ?? "")
        : undefined
    );
  }

  segments.push(currentSegment);
  return segments;
};

// Reconstruct a paragraph node from line arrays
const buildParagraph = (lines: PhrasingContent[][]): Paragraph | null => {
  const children: PhrasingContent[] = [];
  for (const [i, line] of lines.entries()) {
    if (i > 0) children.push({ type: "text", value: "\n" });
    children.push(...line);
  }
  if (children.length === 0) return null;
  return { type: "paragraph", children };
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
        hProperties: {}
      }
    });

    tabCounter++;
    i = childEnd;
  }

  return {
    type: "tabsList",
    depth: targetDepth,
    groupId: gId,
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
  sourceLines?: readonly string[]
): void => {
  const newChildren: typeof children = [];
  let i = 0;

  while (i < children.length) {
    const node = children[i];
    if (!node) break;

    if (node.type === "paragraph") {
      const headerPara = extractHeaderPara(node);

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
            const segments = splitBlockquote(bq, explicit, sourceLines);
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
            if (ending) {
              children.splice(j, 0, ...ending);
              break;
            }
          } else if (sibling.type === "paragraph") {
            const prevDepth = lastTab().depth;
            const contHeaders = extractHeaderPara(sibling, false, prevDepth);
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
  const sourceLines = source?.split(/\r?\n/);
  const walk = (node: Container): void => {
    if (!Array.isArray(node.children) || node.children.length === 0) return;
    processTabsInChildren(
      node.children as Array<BlockContent | DefinitionContent>,
      containerClass,
      false,
      sourceLines
    );
    for (const child of node.children) walk(child as Container);
  };
  processTabsInChildren(root.children, containerClass, true, sourceLines);
  for (const child of root.children) walk(child as Container);
};
