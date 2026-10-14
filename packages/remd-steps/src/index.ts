// This plugin performs heavy tree-rewriting across mdast/hast/unist types
// that don't unify cleanly; type assertions bridging those boundaries are
// reviewed and intentional, so the rule is disabled file-wide rather than
// per-cast. Defensive optional chains on array[i] accesses are also kept
// because TS doesn't model index access as fallible.
/* oxlint-disable typescript/no-unsafe-type-assertion */
/* oxlint-disable typescript/no-unnecessary-condition */
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type {
  Root,
  Paragraph,
  Blockquote,
  PhrasingContent,
  BlockContent,
  DefinitionContent
} from "mdast";
import type { Element, ElementContent, Properties } from "hast";
import type { State, Handler } from "mdast-util-to-hast";
import type { StepsOptions } from "./types.js";

export type { StepsOptions };

// Groups: 1=@ string (depth), 2=number, 3=rest of line (may be empty or title text)
const STEP_HEADER_RE = /^(@{1,6})(\d+)\. ?(.*)/s;

// ── MDAST node types ──────────────────────────────────────────────────────────

interface StepsListNode {
  type: "stepsList";
  depth: number;
  containerClass?: string;
  children: StepsItemNode[];
  data?: { attrsRole?: string; hProperties?: Properties };
}

interface StepsItemNode {
  type: "stepsItem";
  depth: number;
  number: number;
  title: PhrasingContent[];
  children: Array<BlockContent | DefinitionContent | StepsListNode>;
  data?: {
    attrsRole?: string;
    attrsTitle?: PhrasingContent[];
    hProperties?: Properties;
  };
}

// ── Parser helpers ────────────────────────────────────────────────────────────

interface ParsedHeader {
  depth: number;
  number: number;
  rest: string;
}

const parseHeaderPrefix = (text: string): ParsedHeader | null => {
  const m = STEP_HEADER_RE.exec(text);
  if (!m) return null;
  return { depth: m[1].length, number: parseInt(m[2], 10), rest: m[3] };
};

// ── Raw step types ────────────────────────────────────────────────────────────

interface RawStep {
  depth: number;
  number: number;
  titleNodes: PhrasingContent[];
  body: Array<BlockContent | DefinitionContent>;
}

// ── Paragraph line splitting ──────────────────────────────────────────────────

const paraToLines = (para: Paragraph): PhrasingContent[][] => {
  type Seg = PhrasingContent | null;
  const segs: Seg[] = [];

  for (const child of para.children) {
    if (child.type === "text") {
      const parts = child.value.split("\n");
      for (let p = 0; p < parts.length; p++) {
        if (p > 0) segs.push(null);
        if (parts[p] !== "") segs.push({ type: "text", value: parts[p] });
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
    else lines[lines.length - 1].push(seg);
  }
  return lines;
};

// ── Header paragraph extraction ───────────────────────────────────────────────

// Extract step headers from a paragraph where every line is an @N. header.
// Mutates `counters` in place so call sites share counter state across siblings.
// A depth-skipping or non-header line ends the group: the steps before it are
// returned with that line and the ones after it as `rest`, to be rendered as an
// ordinary paragraph after the list.
// requireDepthOne: first header must be depth 1.
interface HeaderPara {
  steps: RawStep[];
  rest: PhrasingContent[][];
  restLine: number;
}

const extractHeaderPara = (
  para: Paragraph,
  counters: Map<number, number>,
  requireDepthOne = true,
  prevDepth = 0
): HeaderPara | null => {
  const lines = paraToLines(para);
  const steps: RawStep[] = [];
  let currentDepth = prevDepth;
  const stop = (index: number): HeaderPara | null =>
    steps.length > 0
      ? {
          steps,
          rest: lines.slice(index),
          restLine: (para.position?.start.line ?? 1) + index
        }
      : null;

  for (const [index, lineSegs] of lines.entries()) {
    const first = lineSegs[0];
    if (first?.type !== "text") return stop(index);

    const header = parseHeaderPrefix(first.value);
    if (!header) return stop(index);

    const { depth } = header;
    if (steps.length === 0 && requireDepthOne && depth !== 1) return null;
    if (depth > currentDepth + 1) return stop(index);

    for (const k of counters.keys()) if (k > depth) counters.delete(k);
    const number = (counters.get(depth) ?? 0) + 1;
    counters.set(depth, number);
    currentDepth = depth;

    const titleNodes: PhrasingContent[] = header.rest
      ? [{ type: "text", value: header.rest }, ...lineSegs.slice(1)]
      : lineSegs.slice(1);

    steps.push({ depth, number, titleNodes, body: [] });
  }

  return stop(lines.length);
};

// Lines left over after a group ends become ordinary paragraphs, split before
// every line that opens a new group (a depth-1 header), so the main loop can
// start that group. Positions follow the source lines (paragraph lines map 1:1
// to source lines) because group ids hash the start line.
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
      first?.type === "text" && parseHeaderPrefix(first.value)?.depth === 1;
    if (opens && index > start) {
      flush(index);
      start = index;
    }
  });
  flush(lines.length);
  return paragraphs;
};

// ── Blockquote splitting ──────────────────────────────────────────────────────

// Remark absorbs adjacent non-blank lines after the first @paragraph into one
// blockquote. We split that blockquote on any embedded @N. step header lines.
interface BQSegment {
  header: Omit<RawStep, "body"> | null; // null = pre-header content (goes to previous step)
  body: Array<BlockContent | DefinitionContent>;
}

const buildParagraph = (lines: PhrasingContent[][]): Paragraph | null => {
  const children: PhrasingContent[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) children.push({ type: "text", value: "\n" });
    children.push(...lines[i]);
  }
  if (children.length === 0) return null;
  return { type: "paragraph", children };
};

const splitBlockquote = (
  bq: Blockquote,
  counters: Map<number, number>,
  currentDepth: number
): BQSegment[] => {
  const segments: BQSegment[] = [];
  let currentSegment: BQSegment = { header: null, body: [] };

  for (const child of bq.children) {
    if (child.type !== "paragraph") {
      currentSegment.body.push(child);
      continue;
    }

    const lines = paraToLines(child);
    let bodyLines: PhrasingContent[][] = [];

    for (const lineSegs of lines) {
      const first = lineSegs[0];
      if (first?.type === "text") {
        const header = parseHeaderPrefix(first.value);
        if (header && header.depth <= currentDepth + 1) {
          // Flush accumulated body lines
          if (bodyLines.length > 0) {
            const bodyPara = buildParagraph(bodyLines);
            if (bodyPara) currentSegment.body.push(bodyPara);
            bodyLines = [];
          }

          segments.push(currentSegment);

          // Update counter tracking
          for (const k of counters.keys())
            if (k > header.depth) counters.delete(k);
          const number = (counters.get(header.depth) ?? 0) + 1;
          counters.set(header.depth, number);
          currentDepth = header.depth;

          const titleNodes: PhrasingContent[] = header.rest
            ? [{ type: "text", value: header.rest }, ...lineSegs.slice(1)]
            : lineSegs.slice(1);

          currentSegment = {
            header: { depth: header.depth, number, titleNodes },
            body: []
          };
          continue;
        }
      }
      bodyLines.push(lineSegs);
    }

    if (bodyLines.length > 0) {
      const bodyPara = buildParagraph(bodyLines);
      if (bodyPara) currentSegment.body.push(bodyPara);
    }
  }

  segments.push(currentSegment);
  return segments;
};

// ── Tree builder ──────────────────────────────────────────────────────────────

const buildTree = (
  steps: RawStep[],
  targetDepth: number,
  start: number,
  end: number
): StepsListNode => {
  const items: StepsItemNode[] = [];
  let i = start;

  while (i < end) {
    const s = steps[i];
    if (s.depth !== targetDepth) {
      i++;
      continue;
    }

    let childEnd = i + 1;
    while (childEnd < end && steps[childEnd].depth > targetDepth) childEnd++;

    const bodyChildren: StepsItemNode["children"] = [
      ...s.body
    ] as StepsItemNode["children"];
    const hasDeeper = steps
      .slice(i + 1, childEnd)
      .some((ss) => ss.depth === targetDepth + 1);
    if (hasDeeper) {
      const nested = buildTree(steps, targetDepth + 1, i + 1, childEnd);
      bodyChildren.push(nested);
    }

    items.push({
      type: "stepsItem",
      depth: targetDepth,
      number: s.number,
      title: s.titleNodes,
      children: bodyChildren,
      data: { attrsRole: "containerItem", attrsTitle: s.titleNodes }
    });

    i = childEnd;
  }

  return {
    type: "stepsList",
    depth: targetDepth,
    children: items,
    data: { attrsRole: "container" }
  };
};

// ── Remark plugin ─────────────────────────────────────────────────────────────

// Process all step groups found in a children array in-place.
// Used at root level and recursively inside any parent node's children.
const processStepsInChildren = (
  children: Array<BlockContent | DefinitionContent | Root["children"][number]>,
  containerClass: string
): void => {
  const newChildren: typeof children = [];
  let i = 0;

  while (i < children.length) {
    const node = children[i];

    if (node.type === "paragraph") {
      const counters = new Map<number, number>();
      const headerPara = extractHeaderPara(node, counters);

      if (headerPara) {
        const rawSteps: RawStep[] = [...headerPara.steps];
        // Lines left over after a depth-skipping or non-header line end the group.
        let rest = headerPara.rest;
        let restLine = headerPara.restLine;
        let j = i + 1;
        let currentStepIdx = rawSteps.length - 1;
        let currentDepth = rawSteps[rawSteps.length - 1].depth;

        while (rest.length === 0 && j < children.length) {
          const sibling = children[j];

          if (sibling.type === "blockquote") {
            const segments = splitBlockquote(sibling, counters, currentDepth);

            const firstSeg = segments[0];
            if (firstSeg?.header === null) {
              rawSteps[currentStepIdx].body.push(...firstSeg.body);
            }

            for (let s = 1; s < segments.length; s++) {
              const seg = segments[s];
              if (seg.header) {
                rawSteps.push({ ...seg.header, body: seg.body });
                currentStepIdx = rawSteps.length - 1;
                currentDepth = seg.header.depth;
              }
            }

            j++;
          } else if (sibling.type === "paragraph") {
            const prevDepth = rawSteps[rawSteps.length - 1].depth;
            const contHeaders = extractHeaderPara(
              sibling,
              counters,
              false,
              prevDepth
            );
            if (contHeaders) {
              rawSteps.push(...contHeaders.steps);
              rest = contHeaders.rest;
              restLine = contHeaders.restLine;
              currentStepIdx = rawSteps.length - 1;
              currentDepth = rawSteps[rawSteps.length - 1].depth;
              j++;
              continue;
            }
            break;
          } else {
            break;
          }
        }

        const list = buildTree(rawSteps, 1, 0, rawSteps.length);
        list.containerClass = containerClass;
        newChildren.push(list as unknown as Root["children"][number]);
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

/** remark plugin for numbered step sequences, rendering ordered step lists via {@link stepsHastHandlers}. */
export const remarkSteps: Plugin<[StepsOptions?], Root> = function (
  options = {}
) {
  const { containerClass = "markdown-steps" } = options;

  return (tree) => {
    // Process steps at root level first
    processStepsInChildren(tree.children, containerClass);

    // Then visit every parent node whose children may contain step syntax —
    // this handles steps nested inside tab bodies or other block containers.
    visit(tree, (node) => {
      if ("children" in node && node.type !== "root") {
        const parent = node as {
          children: Array<BlockContent | DefinitionContent>;
        };
        if (parent.children.length > 0) {
          processStepsInChildren(parent.children, containerClass);
        }
      }
    });
  };
};

// ── HAST handlers ─────────────────────────────────────────────────────────────

const buildListHast = (
  list: StepsListNode,
  containerClass: string,
  state: State
): Element => {
  const items: ElementContent[] = list.children.map((item) => {
    const liChildren: ElementContent[] = [];

    if (item.title.length > 0) {
      liChildren.push({
        type: "element",
        tagName: "p",
        properties: { class: `${containerClass}-title` },
        children: state.all({
          type: "paragraph",
          children: item.title
        })
      });
    }

    const bodyBlocks = item.children.filter(
      (c) => (c as unknown as { type: string }).type !== "stepsList"
    ) as Array<BlockContent | DefinitionContent>;
    const nestedLists = item.children.filter(
      (c) => (c as unknown as { type: string }).type === "stepsList"
    ) as unknown as StepsListNode[];

    if (bodyBlocks.length > 0) {
      liChildren.push({
        type: "element",
        tagName: "div",
        properties: { class: `${containerClass}-body` },
        children: state.all({
          type: "root",
          children: bodyBlocks
        })
      });
    }

    for (const nested of nestedLists) {
      liChildren.push(buildListHast(nested, containerClass, state));
    }

    const liProps: Properties = {
      class: `${containerClass}-item`,
      "data-step": String(item.number)
    };
    if (item.data?.hProperties) {
      const { class: extraClass, ...rest } = item.data.hProperties;
      if (extraClass)
        liProps.class = `${String(liProps.class)} ${String(extraClass)}`;
      Object.assign(liProps, rest);
    }

    return {
      type: "element",
      tagName: "li",
      properties: liProps,
      children: liChildren
    } satisfies Element;
  });

  const baseClass =
    list.depth === 1 ? containerClass : `${containerClass}-list`;
  const olProps: Properties = { class: baseClass };
  if (list.data?.hProperties) {
    const { class: extraClass, ...rest } = list.data.hProperties;
    if (extraClass)
      olProps.class = `${String(olProps.class)} ${String(extraClass)}`;
    Object.assign(olProps, rest);
  }

  return {
    type: "element",
    tagName: "ol",
    properties: olProps,
    children: items
  };
};

/** mdast-to-hast handler for steps nodes, for use with `remark-rehype`. */
export const stepsHastHandlers: Record<string, Handler> = {
  stepsList(state: State, node: StepsListNode): ElementContent {
    const containerClass = node.containerClass ?? "markdown-steps";
    const result = buildListHast(node, containerClass, state);
    state.patch(node as unknown as Parameters<typeof state.patch>[0], result);
    return result;
  }
};
