// Recognition for numbered step sequences, shared by the remark and Sätteri plugins: header lines (`@1. Title`) and their `>` bodies become `stepsList`/`stepsItem` nodes, which each engine then renders. It rewrites mdast in place, so a read-only engine runs it on a copy.
// This module performs heavy tree-rewriting across mdast/hast types that don't unify cleanly; type assertions bridging those boundaries are reviewed and intentional, so the rule is disabled file-wide rather than per-cast. Defensive optional chains on array[i] accesses are also kept because TS doesn't model index access as fallible.
/* oxlint-disable typescript/no-unsafe-type-assertion */
/* oxlint-disable typescript/no-unnecessary-condition */
import type {
  Root,
  Paragraph,
  Blockquote,
  PhrasingContent,
  BlockContent,
  DefinitionContent
} from "mdast";
import type { Properties } from "hast";
import {
  blockquoteMarkers,
  markerCount,
  rebuildLazyLines,
  type MarkedLine
} from "./lazy.js";

// Groups: 1=@ string (depth), 2=number, 3=rest of line (may be empty or title text)
const STEP_HEADER_RE = /^(@{1,6})(\d+)\. ?(.*)/s;

// ── MDAST node types ──────────────────────────────────────────────────────────

/** A list of steps at one depth, rendered as an `<ol>`. */
export interface StepsListNode {
  type: "stepsList";
  depth: number;
  containerClass?: string;
  children: StepsItemNode[];
  data?: { attrsRole?: string; hProperties?: Properties };
}

/** A step's title, rendered as its title `<p>` unless it is empty. */
export interface StepsTitleNode {
  type: "stepsTitle";
  children: PhrasingContent[];
}

/** One step: its title (always the first child, so transforms that walk children reach it), body and nested steps, rendered as an `<li>`. */
export interface StepsItemNode {
  type: "stepsItem";
  depth: number;
  number: number;
  children: Array<
    StepsTitleNode | BlockContent | DefinitionContent | StepsListNode
  >;
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
  const [, hashes = "", digits = "", rest = ""] = m;
  return { depth: hashes.length, number: parseInt(digits, 10), rest };
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
  for (const [i, line] of lines.entries()) {
    if (i > 0) children.push({ type: "text", value: "\n" });
    children.push(...line);
  }
  if (children.length === 0) return null;
  return { type: "paragraph", children };
};

interface ParentLike {
  type: string;
  children?: ParentLike[];
}

// CommonMark lets a line without a blockquote's `>` markers continue the paragraph before it, so lines meant for the next step can end up in a paragraph nested in a step's body (in a deeper blockquote or a list item), where markdown-it reads them by their markers instead. From the deepest last paragraph of `node`, take the lines from the first one written outside the step body (with fewer markers than the body's own, `base`) that `isHeader` accepts; the paragraph is cut before it, in place.
const takeLazyLines = (
  node: BlockContent | DefinitionContent,
  sourceLines: readonly string[],
  base: number,
  isHeader: (segs: PhrasingContent[]) => boolean
): MarkedLine[] | null => {
  let parent = node as unknown as ParentLike;
  let last = parent.children?.at(-1);
  while (last?.type !== "paragraph") {
    if (!last?.children?.length) return null;
    parent = last;
    last = parent.children?.at(-1);
  }
  const para = last as unknown as Paragraph;
  const start = para.position?.start.line;
  if (start === undefined || !parent.children) return null;
  const lines = paraToLines(para).map((segs, index): MarkedLine => ({
    segs,
    markers: markerCount(sourceLines[start - 1 + index] ?? "")
  }));
  const at = lines.findIndex(
    ({ segs, markers }, index) => index > 0 && markers < base && isHeader(segs)
  );
  if (at === -1) return null;
  const kept = buildParagraph(lines.slice(0, at).map(({ segs }) => segs));
  parent.children.splice(
    -1,
    1,
    ...(kept ? [kept as unknown as ParentLike] : [])
  );
  return lines.slice(at);
};

const splitBlockquote = (
  bq: Blockquote,
  counters: Map<number, number>,
  currentDepth: number,
  sourceLines?: readonly string[]
): BQSegment[] => {
  const segments: BQSegment[] = [];
  let currentSegment: BQSegment = { header: null, body: [] };
  // The `>` markers of the step body's own lines.
  const base = sourceLines ? blockquoteMarkers(bq, sourceLines) : undefined;

  // A line's step header, if it has one that fits the group's depth.
  const stepHeader = (lineSegs: PhrasingContent[]): ParsedHeader | null => {
    const first = lineSegs[0];
    if (first?.type !== "text") return null;
    const header = parseHeaderPrefix(first.value);
    return header && header.depth <= currentDepth + 1 ? header : null;
  };

  const startStep = (
    header: ParsedHeader,
    lineSegs: PhrasingContent[]
  ): void => {
    segments.push(currentSegment);

    // Update counter tracking
    for (const k of counters.keys()) if (k > header.depth) counters.delete(k);
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
  };

  for (const child of bq.children) {
    if (child.type !== "paragraph") {
      currentSegment.body.push(child);
      if (!sourceLines || base === undefined) continue;
      const lazy = takeLazyLines(
        child,
        sourceLines,
        base,
        (segs) => stepHeader(segs) !== null
      );
      if (!lazy) continue;
      // The header and the lines after it: the steps they start, and those steps' bodies.
      let pending: MarkedLine[] = [];
      const flush = (): void => {
        const relative = pending.map((line) => ({
          ...line,
          markers: line.markers - base
        }));
        currentSegment.body.push(...rebuildLazyLines(relative, 0));
        pending = [];
      };
      for (const line of lazy) {
        const header = line.markers < base ? stepHeader(line.segs) : null;
        if (header) {
          flush();
          startStep(header, line.segs);
        } else {
          pending.push(line);
        }
      }
      flush();
      continue;
    }

    let bodyLines: PhrasingContent[][] = [];
    for (const lineSegs of paraToLines(child)) {
      const header = stepHeader(lineSegs);
      if (header) {
        // Flush accumulated body lines
        const bodyPara = buildParagraph(bodyLines);
        if (bodyPara) currentSegment.body.push(bodyPara);
        bodyLines = [];
        startStep(header, lineSegs);
        continue;
      }
      bodyLines.push(lineSegs);
    }

    const bodyPara = buildParagraph(bodyLines);
    if (bodyPara) currentSegment.body.push(bodyPara);
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
    if (s?.depth !== targetDepth) {
      i++;
      continue;
    }

    let childEnd = i + 1;
    while (childEnd < end && (steps[childEnd]?.depth ?? 0) > targetDepth)
      childEnd++;

    // The title node shares `titleNodes` with `attrsTitle`, so attrs trimming one trims the other.
    const bodyChildren: StepsItemNode["children"] = [
      { type: "stepsTitle", children: s.titleNodes },
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
export const processStepsInChildren = (
  children: Array<BlockContent | DefinitionContent | Root["children"][number]>,
  containerClass: string,
  sourceLines?: readonly string[]
): void => {
  const newChildren: typeof children = [];
  let i = 0;

  while (i < children.length) {
    const node = children[i];
    if (!node) break;

    if (node.type === "paragraph") {
      const counters = new Map<number, number>();
      const headerPara = extractHeaderPara(node, counters);

      if (headerPara) {
        const rawSteps: RawStep[] = [...headerPara.steps];
        // Lines left over after a depth-skipping or non-header line end the group.
        let rest = headerPara.rest;
        let restLine = headerPara.restLine;
        let j = i + 1;
        // A group always starts with at least one step.
        const lastStep = (): RawStep => rawSteps[rawSteps.length - 1]!;
        let currentStepIdx = rawSteps.length - 1;
        let currentDepth = lastStep().depth;

        while (rest.length === 0 && j < children.length) {
          const sibling = children[j];
          if (!sibling) break;

          if (sibling.type === "blockquote") {
            const segments = splitBlockquote(
              sibling,
              counters,
              currentDepth,
              sourceLines
            );

            const firstSeg = segments[0];
            if (firstSeg?.header === null) {
              rawSteps[currentStepIdx]?.body.push(...firstSeg.body);
            }

            for (let s = 1; s < segments.length; s++) {
              const seg = segments[s];
              if (seg?.header) {
                rawSteps.push({ ...seg.header, body: seg.body });
                currentStepIdx = rawSteps.length - 1;
                currentDepth = seg.header.depth;
              }
            }

            j++;
          } else if (sibling.type === "paragraph") {
            const prevDepth = lastStep().depth;
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
              currentDepth = lastStep().depth;
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

interface Container {
  children?: unknown[];
}

/**
 * Turn every step sequence in `root` into `stepsList` nodes, at the top level and inside any container (blockquotes, list items, tab panels…), walking into the lists it builds so nested sequences are found too. With the document's `source`, a step header that CommonMark lazily continued into a nested paragraph is recognized too, as markdown-it reads it.
 */
export const processSteps = (
  root: Root,
  containerClass: string,
  source?: string
): void => {
  const sourceLines = source?.split(/\r?\n/);
  const walk = (node: Container): void => {
    if (!Array.isArray(node.children) || node.children.length === 0) return;
    processStepsInChildren(
      node.children as Array<BlockContent | DefinitionContent>,
      containerClass,
      sourceLines
    );
    for (const child of node.children) walk(child as Container);
  };
  processStepsInChildren(root.children, containerClass, sourceLines);
  for (const child of root.children) walk(child as Container);
};
