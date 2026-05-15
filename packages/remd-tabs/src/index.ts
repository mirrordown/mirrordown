import { visit } from "unist-util-visit";
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
  // true when this blockquote was written with explicit `> %` nesting (multiple
  // block children) rather than being the standard absorbed-tabs pattern where
  // remark collapses consecutive `% Tab\n> body` lines into one blockquote.
  // Used to apply a depth offset and to unwrap nested blockquote bodies.
  explicit: boolean;
}

// A blockquote is "explicit" (`> % Label` nesting) when at least one of its
// direct paragraph children starts with a tab header. The absorbed pattern
// (remark collapsing consecutive `% Tab\n> body` lines into one blockquote)
// never produces standalone header paragraphs — headers are only embedded
// inside multi-line text nodes.
const isExplicitBQ = (bq: Blockquote): boolean =>
  bq.children.some((child) => {
    if (child.type !== "paragraph") return false;
    const first = (child as Paragraph).children[0];
    return first?.type === "text" && parseTabHeader(first.value.split("\n")[0]!) !== null;
  });

// Walk to the deepest last child of a node and return its paragraph if it
// has a trailing tab header line, along with the truncated paragraph and the
// extracted RawTab header. Returns null if no trailing tab header is found.
// This handles cases where remark plugins (e.g. remarkDefinitionList) transform
// absorbed paragraphs into custom nodes — the trailing "% Code" line ends up
// inside a nested paragraph rather than at the blockquote's top level.
const extractTrailingTabHeader = (
  node: BlockContent | DefinitionContent,
): { header: RawTab; truncatedPara: Paragraph | null; path: (BlockContent | DefinitionContent)[] } | null => {
  // Walk to the deepest last child that is a paragraph
  const path: (BlockContent | DefinitionContent)[] = [];
  let current: BlockContent | DefinitionContent = node;
  while ("children" in current && current.children.length > 0) {
    const last = current.children[current.children.length - 1] as BlockContent | DefinitionContent;
    if (last.type === "paragraph") {
      path.push(current);
      // Check if this paragraph's last line is a tab header
      const para = last as Paragraph;
      const lines = paraToLines(para);
      const lastLine = lines[lines.length - 1];
      if (!lastLine) return null;
      const first = lastLine[0];
      if (first?.type !== "text") return null;
      const header = parseTabHeader(first.value);
      if (!header) return null;
      const labelText = header.label;
      const labelNodes: PhrasingContent[] = labelText
        ? [{ type: "text", value: labelText }, ...lastLine.slice(1)]
        : lastLine.slice(1);
      const rawTab: RawTab = {
        depth: header.depth,
        open: header.open,
        labelNodes,
        labelText: toPlainText(labelNodes),
        body: [],
      };
      // Build truncated paragraph without the last line
      const truncatedLines = lines.slice(0, -1);
      const truncatedPara = buildParagraph(truncatedLines);
      return { header: rawTab, truncatedPara, path };
    }
    if (!("children" in last)) break;
    path.push(current);
    current = last;
  }
  return null;
};

const splitBlockquote = (bq: Blockquote, explicit: boolean): BQSegment[] => {
  const segments: BQSegment[] = [];
  let currentSegment: BQSegment = { header: null, body: [], explicit };

  for (const child of bq.children) {
    if (child.type !== "paragraph") {
      // For non-paragraph children (e.g. defList from remarkDefinitionList),
      // check if the deepest last-child paragraph has a trailing tab header.
      // Remark may have absorbed a "% NextTab" line into that nested paragraph.
      const extracted = extractTrailingTabHeader(child as BlockContent | DefinitionContent);
      if (extracted) {
        // Clone the child with the trailing header line removed from its nested paragraph
        const cloned = JSON.parse(JSON.stringify(child)) as BlockContent | DefinitionContent;
        // Navigate to the deepest last child and replace the paragraph
        let target: any = cloned;
        for (let pi = 1; pi < extracted.path.length; pi++) {
          target = target.children[target.children.length - 1];
        }
        const deepestParent = target;
        if (extracted.truncatedPara) {
          deepestParent.children[deepestParent.children.length - 1] = extracted.truncatedPara;
        } else {
          deepestParent.children.splice(deepestParent.children.length - 1, 1);
        }
        currentSegment.body.push(cloned);
        // Start a new segment for the extracted tab header
        segments.push(currentSegment);
        currentSegment = { header: extracted.header, body: [], explicit };
      } else {
        currentSegment.body.push(child as BlockContent);
      }
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
            explicit,
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

// Process all tab groups found in a children array in-place.
// Used at root level and recursively inside any parent node's children.
// checkBlankLines: when false, skip the line-gap termination check (for nested contexts
// where blank lines inside blockquotes produce position gaps but are still part of the group).
const processTabsInChildren = (
  children: (BlockContent | DefinitionContent | RootContent)[],
  containerClass: string,
  checkBlankLines = true,
): void => {
  const newChildren: typeof children = [];
  let i = 0;

  while (i < children.length) {
    const node = children[i]!;

    if (node.type === "paragraph") {
      const headerTabs = extractHeaderPara(node as Paragraph);

      if (headerTabs && headerTabs.length > 0) {
        const rawTabs: RawTab[] = [...headerTabs];
        const startLine = (node.position?.start.line ?? 1) - 1;
        let j = i + 1;
        let currentTabIdx = rawTabs.length - 1;
        let prevEndLine = node.position?.end.line ?? 0;

        while (j < children.length) {
          const sibling = children[j]!;
          const siblingStartLine =
            (sibling as { position?: { start: { line: number } } }).position?.start.line ??
            prevEndLine + 1;

          if (checkBlankLines && siblingStartLine > prevEndLine + 1) break;

          if (sibling.type === "blockquote") {
            const bq = sibling as Blockquote;
            const explicit = isExplicitBQ(bq);
            const segments = splitBlockquote(bq, explicit);

            const firstSeg = segments[0];
            if (firstSeg?.header === null) {
              rawTabs[currentTabIdx]!.body.push(...firstSeg.body);
            }

            // Explicit blockquotes (`> % Label` nesting) have their headers
            // implicitly one level deeper than the owning tab. Apply a depth
            // offset so they nest correctly.
            // Absorbed blockquotes (standard `% Tab\n> body` pattern) keep
            // literal depths — remark collapses them into a single paragraph child.
            const depthOffset = explicit ? rawTabs[rawTabs.length - 1]!.depth : 0;

            for (let s = 1; s < segments.length; s++) {
              const seg = segments[s]!;
              if (!seg.header) continue;

              const adjustedDepth = depthOffset + seg.header.depth;
              const prevDepth = rawTabs[rawTabs.length - 1]!.depth;
              if (adjustedDepth > prevDepth + 1) continue;

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
                    if (escapedSegs.length > 0) {
                      escapedSegs[escapedSegs.length - 1]!.body.push(
                        b as BlockContent | DefinitionContent,
                      );
                    } else {
                      seg.header.body.push(b as BlockContent | DefinitionContent);
                    }
                    continue;
                  }
                  const innerBq = b as Blockquote;
                  if (!isExplicitBQ(innerBq)) {
                    // Re-split absorbed inner blockquote to extract sibling headers
                    const innerSegs = splitBlockquote(innerBq, false);
                    const innerFirst = innerSegs[0];
                    if (innerFirst?.header === null) {
                      seg.header.body.push(...innerFirst.body);
                    }
                    for (let is = 1; is < innerSegs.length; is++) {
                      const innerSeg = innerSegs[is]!;
                      if (!innerSeg.header) continue;
                      // If the re-split segment has no body, its body was hoisted to
                      // the outer BQ as a direct child — it is an outer-level escaped
                      // tab (originally root-level, absorbed by remark into this inner BQ).
                      // Push it at depthOffset (the owning explicit BQ's parent depth).
                      if (innerSeg.body.length === 0) {
                        innerSeg.header.depth = depthOffset;
                        escapedSegs.push(innerSeg.header);
                        deferredInnerSegs.push(innerSeg);
                        continue;
                      }
                      const tentativeDepth = depthOffset + innerSeg.header.depth;
                      const innerPrevDepth = rawTabs[rawTabs.length - 1]!.depth;
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
          } else if (sibling.type === "paragraph") {
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

  children.splice(0, children.length, ...newChildren);
};

export const remarkTabs: Plugin<[TabsOptions?], Root> = function (options = {}) {
  const { containerClass = "markdown-tabs" } = options;

  return (tree) => {
    // Process tabs at root level first
    processTabsInChildren(tree.children, containerClass);

    // Then visit every parent node whose children may contain tab syntax —
    // this handles tabs nested inside step bodies or other block containers.
    // Blank-line position checks are disabled for nested content: blank lines
    // inside a blockquote produce position gaps that would incorrectly terminate
    // a tab group when the content has been lifted out of its blockquote context.
    visit(tree, (node) => {
      if ("children" in node && node.type !== "root") {
        const parent = node as { children: (BlockContent | DefinitionContent)[] };
        if (parent.children.length > 0) {
          processTabsInChildren(parent.children, containerClass, false);
        }
      }
    });
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
