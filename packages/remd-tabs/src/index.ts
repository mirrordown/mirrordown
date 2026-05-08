import type { Plugin } from "unified";
import type {
  Root,
  Paragraph,
  Blockquote,
  PhrasingContent,
  BlockContent,
  DefinitionContent,
  RootContent,
} from "mdast";
import type { Element, ElementContent, Properties } from "hast";
import type { State } from "mdast-util-to-hast";
import type { TabsOptions, TabsListNode, TabsItemNode } from "./types.js";
import { parseTabHeader, stripAttrs, groupId, blockId } from "./utils.js";

export type { TabsOptions };

// ── Raw extraction types ──────────────────────────────────────────────────────

interface RawTab {
  depth: number;
  open: boolean;
  labelNodes: PhrasingContent[]; // inline nodes for the label
  labelText: string; // plain text for aria-label / data-tab
  body: (BlockContent | DefinitionContent)[]; // blockquote contents
}

// ── Paragraph line splitting ──────────────────────────────────────────────────

// Split a paragraph's inline children into lines by text "\n" boundaries.
const paraToLines = (para: Paragraph): PhrasingContent[][] => {
  type Seg = PhrasingContent | null;
  const segs: Seg[] = [];

  for (const child of para.children) {
    if (child.type === "text") {
      const parts = child.value.split("\n");
      for (let p = 0; p < parts.length; p++) {
        if (p > 0) segs.push(null);
        if (parts[p] !== "") segs.push({ type: "text", value: parts[p]! });
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
    else lines[lines.length - 1]!.push(seg);
  }
  return lines;
};

// Extract plain text from PhrasingContent nodes (strips all markup)
const toPlainText = (nodes: PhrasingContent[]): string =>
  nodes
    .map((n) => {
      if (n.type === "text" || n.type === "inlineCode") return "value" in n ? n.value : "";
      if ("children" in n) return toPlainText(n.children as PhrasingContent[]);
      return "";
    })
    .join("");

// ── Tab group extraction ──────────────────────────────────────────────────────

// Parse a paragraph node that consists entirely of % tab headers (no body
// content). Returns null if the paragraph isn't all headers.
// requireDepthOne: if true, the first header must be depth 1 (top-level group start).
// If false, allows any starting depth (for continuation paragraphs).
const extractHeaderPara = (
  para: Paragraph,
  requireDepthOne = true,
  prevDepth = 0,
): RawTab[] | null => {
  const lines = paraToLines(para);
  const tabs: RawTab[] = [];
  let currentDepth = prevDepth;

  for (const lineSegs of lines) {
    const first = lineSegs[0];
    if (!first || first.type !== "text") return null;

    const header = parseTabHeader(first.value);
    if (!header) return null;

    const { depth, open } = header;
    if (tabs.length === 0 && requireDepthOne && depth !== 1) return null;
    if (depth > currentDepth + 1) break;
    currentDepth = depth;

    const labelText = header.label;
    const labelNodes: PhrasingContent[] = labelText
      ? [{ type: "text", value: labelText }, ...lineSegs.slice(1)]
      : lineSegs.slice(1);

    tabs.push({ depth, open, labelNodes, labelText: toPlainText(labelNodes), body: [] });
  }

  return tabs.length > 0 ? tabs : null;
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
  body: (BlockContent | DefinitionContent)[];
}

const splitBlockquote = (bq: Blockquote): BQSegment[] => {
  const segments: BQSegment[] = [];
  let currentSegment: BQSegment = { header: null, body: [] };

  for (const child of bq.children) {
    if (child.type !== "paragraph") {
      currentSegment.body.push(child as BlockContent);
      continue;
    }

    // Check if this paragraph contains tab headers mixed with body text
    const lines = paraToLines(child as Paragraph);
    let bodyLines: PhrasingContent[][] = [];

    for (const lineSegs of lines) {
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
              labelText: toPlainText(labelNodes),
              body: [],
            },
            body: [],
          };
          continue;
        }
      }
      bodyLines.push(lineSegs);
    }

    // Flush remaining body lines
    if (bodyLines.length > 0) {
      const bodyPara = buildParagraph(bodyLines);
      if (bodyPara) currentSegment.body.push(bodyPara);
    }
  }

  segments.push(currentSegment);
  return segments;
};

// Reconstruct a paragraph node from line arrays
const buildParagraph = (lines: PhrasingContent[][]): Paragraph | null => {
  const children: PhrasingContent[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) children.push({ type: "text", value: "\n" });
    children.push(...lines[i]!);
  }
  if (children.length === 0) return null;
  return { type: "paragraph", children };
};

// ── Tree builder ──────────────────────────────────────────────────────────────

const buildTree = (
  rawTabs: RawTab[],
  targetDepth: number,
  start: number,
  end: number,
  containerClass: string,
  startLine: number,
): TabsListNode => {
  const depthLabels = rawTabs
    .slice(start, end)
    .filter((t) => t.depth === targetDepth)
    .map((t) => t.labelText);

  const gId = groupId(depthLabels);
  const bId = blockId(startLine, gId);

  // Absolute index of the first %+ tab at this depth (-1 if none)
  const explicitOpenIdx = rawTabs
    .slice(start, end)
    .findIndex((t) => t.depth === targetDepth && t.open);
  const explicitOpenAbsIdx = explicitOpenIdx >= 0 ? start + explicitOpenIdx : -1;

  const items: TabsItemNode[] = [];
  let tabCounter = 0;
  let i = start;

  while (i < end) {
    const raw = rawTabs[i]!;
    if (raw.depth !== targetDepth) {
      i++;
      continue;
    }

    let childEnd = i + 1;
    while (childEnd < end && rawTabs[childEnd]!.depth > targetDepth) childEnd++;

    // First %+ wins; if none, first tab is open
    const isOpen = explicitOpenAbsIdx >= 0 ? i === explicitOpenAbsIdx : tabCounter === 0;
    const bodyChildren: TabsItemNode["children"] = [...raw.body];

    const hasDeeper = rawTabs.slice(i + 1, childEnd).some((t) => t.depth === targetDepth + 1);

    if (hasDeeper) {
      const nested = buildTree(
        rawTabs,
        targetDepth + 1,
        i + 1,
        childEnd,
        containerClass,
        startLine,
      );
      nested.containerClass = containerClass;
      bodyChildren.push(nested as unknown as BlockContent);
    }

    items.push({
      type: "tabsItem",
      depth: targetDepth,
      label: raw.labelNodes,
      labelText: raw.labelText,
      open: isOpen,
      children: bodyChildren,
      data: {
        attrsRole: "containerItem",
        attrsTitle: raw.labelNodes,
        attrsItemTitle: true,
        hProperties: {},
      },
    });

    tabCounter++;
    i = childEnd;
  }

  return {
    type: "tabsList",
    depth: targetDepth,
    groupId: gId,
    blockId: bId,
    children: items,
    data: { attrsRole: "container", hProperties: {} },
  };
};

// ── Remark plugin ─────────────────────────────────────────────────────────────

export const remarkTabs: Plugin<[TabsOptions?], Root> = function (options = {}) {
  const { containerClass = "markdown-tabs" } = options;

  return (tree) => {
    const newChildren: Root["children"] = [];
    let i = 0;

    while (i < tree.children.length) {
      const node = tree.children[i]!;

      // Look for a paragraph that consists entirely of % tab headers
      if (node.type === "paragraph") {
        const headerTabs = extractHeaderPara(node as Paragraph);

        if (headerTabs && headerTabs.length > 0) {
          // We have a header paragraph. Now consume alternating
          // paragraph(headers) + blockquote(body) pairs as one tab group.
          //
          // Two AST patterns can occur:
          //   A) paragraph("% A\n% B") + blockquote(mixed body+headers)
          //      — remark folds adjacent non-blank lines into the blockquote
          //   B) paragraph("% A") + blockquote(body) + paragraph("% B") + blockquote(body)
          //      — each tab's body is a clean blockquote (e.g. fenced code blocks)
          //
          // We handle both by:
          //   1. Building rawTabs from the header paragraph
          //   2. Consuming the next blockquote (splitting it for embedded headers)
          //   3. If after the blockquote there's another header paragraph, merge it
          //      into the same group and repeat from step 2

          const rawTabs: RawTab[] = [...headerTabs];
          const startLine = (node.position?.start.line ?? 1) - 1;
          let j = i + 1;

          // Track which rawTab index is "current" (to assign next blockquote to)
          let currentTabIdx = rawTabs.length - 1;
          // Track the end line of the last consumed sibling for blank-line detection
          let prevEndLine = node.position?.end.line ?? 0;

          while (j < tree.children.length) {
            const sibling = tree.children[j]!;
            const siblingStartLine =
              (sibling as { position?: { start: { line: number } } }).position?.start.line ??
              prevEndLine + 1;

            // A blank line between siblings (gap > 1) terminates the group
            if (siblingStartLine > prevEndLine + 1) break;

            if (sibling.type === "blockquote") {
              // Split blockquote for any embedded % headers
              const segments = splitBlockquote(sibling as Blockquote);

              // segments[0] has header=null — its body goes to currentTabIdx
              const firstSeg = segments[0];
              if (firstSeg?.header === null) {
                rawTabs[currentTabIdx]!.body.push(...firstSeg.body);
              }

              // Remaining segments each introduce a new tab
              for (let s = 1; s < segments.length; s++) {
                const seg = segments[s]!;
                if (seg.header) {
                  const prevDepth = rawTabs[rawTabs.length - 1]!.depth;
                  if (seg.header.depth <= prevDepth + 1) {
                    seg.header.body.push(...seg.body);
                    rawTabs.push(seg.header);
                    currentTabIdx = rawTabs.length - 1;
                  }
                }
              }

              prevEndLine = sibling.position?.end.line ?? prevEndLine;
              j++;
            } else if (sibling.type === "paragraph") {
              // Check if it's a continuation header paragraph
              const prevDepth = rawTabs[rawTabs.length - 1]!.depth;
              const contHeaders = extractHeaderPara(sibling as Paragraph, false, prevDepth);
              if (contHeaders && contHeaders.length > 0) {
                rawTabs.push(...contHeaders);
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

          const list = buildTree(rawTabs, 1, 0, rawTabs.length, containerClass, startLine);
          list.containerClass = containerClass;
          newChildren.push(list as unknown as RootContent);
          i = j;
          continue;
        }
      }

      newChildren.push(node);
      i++;
    }

    tree.children = newChildren;
  };
};

// ── HAST handlers ─────────────────────────────────────────────────────────────

const mergeHProperties = (base: Properties, extra?: Properties): Properties => {
  if (!extra) return base;
  const { class: extraClass, ...rest } = extra;
  const result: Properties = { ...base, ...rest };
  if (extraClass)
    result.class = base.class ? `${String(base.class)} ${String(extraClass)}` : extraClass;
  return result;
};

const buildTabsHast = (list: TabsListNode, containerClass: string, state: State): Element => {
  const labelChildren: ElementContent[] = [];
  const panelChildren: ElementContent[] = [];

  list.children.forEach((item, idx) => {
    const labelPlain = stripAttrs(item.labelText);
    const inputId = `${list.blockId}-${idx}`;

    // <input type="radio">
    const inputProps: Properties = {
      type: "radio",
      name: list.blockId,
      id: inputId,
      hidden: true,
      ...(item.open ? { checked: true } : {}),
    };
    labelChildren.push({ type: "element", tagName: "input", properties: inputProps, children: [] });

    // <label>
    const labelProps = mergeHProperties(
      { class: `${containerClass}-label`, for: inputId },
      item.data?.hProperties,
    );
    labelChildren.push({
      type: "element",
      tagName: "label",
      properties: labelProps,
      children: state.all({
        type: "paragraph",
        children: item.label,
      } as Parameters<typeof state.all>[0]),
    });

    // Panel body and nested lists
    const bodyBlocks = item.children.filter((c) => (c as { type: string }).type !== "tabsList") as (
      | BlockContent
      | DefinitionContent
    )[];
    const nestedLists = item.children.filter(
      (c) => (c as { type: string }).type === "tabsList",
    ) as unknown as TabsListNode[];

    const sectionChildren: ElementContent[] = [];

    if (bodyBlocks.length > 0) {
      sectionChildren.push(
        ...state.all({
          type: "root",
          children: bodyBlocks,
        } as Parameters<typeof state.all>[0]),
      );
    }

    for (const nested of nestedLists) {
      sectionChildren.push(buildTabsHast(nested, nested.containerClass ?? containerClass, state));
    }

    // <section>
    const sectionProps = mergeHProperties(
      { class: `${containerClass}-panel`, "aria-label": labelPlain },
      undefined,
    );
    panelChildren.push({
      type: "element",
      tagName: "section",
      properties: sectionProps,
      children: sectionChildren,
    });
  });

  // <div class="...-labels">
  const labelsDiv: Element = {
    type: "element",
    tagName: "div",
    properties: { class: `${containerClass}-labels` },
    children: labelChildren,
  };

  // <div class="...-panels">
  const panelsDiv: Element = {
    type: "element",
    tagName: "div",
    properties: { class: `${containerClass}-panels` },
    children: panelChildren,
  };

  // <div> container
  const divProps = mergeHProperties(
    { class: containerClass, "data-tabs-group": list.groupId },
    list.data?.hProperties,
  );

  const result: Element = {
    type: "element",
    tagName: "div",
    properties: divProps,
    children: [labelsDiv, panelsDiv],
  };

  state.patch(list as unknown as Parameters<typeof state.patch>[0], result);
  return result;
};

export const tabsHastHandlers = {
  tabsList(state: State, node: TabsListNode): ElementContent {
    const containerClass = node.containerClass ?? "markdown-tabs";
    return buildTabsHast(node, containerClass, state);
  },
} as const;
