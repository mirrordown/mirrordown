import type { Plugin } from "unified";
import type { Root, Paragraph, PhrasingContent, BlockContent, DefinitionContent } from "mdast";
import type { Element, ElementContent, Properties } from "hast";
import type { State } from "mdast-util-to-hast";
import type { StepsOptions } from "./types.js";

export type { StepsOptions };

// Groups: 1=@ string (depth), 2=number, 3=rest of line (may be empty or title text)
const STEP_HEADER_RE = /^(@{1,6})(\d+)\. ?(.*)/s;

const CONTINUATION_RE = /^\| ?/;

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
  children: (BlockContent | DefinitionContent | StepsListNode)[];
  data?: { attrsRole?: string; attrsTitle?: PhrasingContent[]; hProperties?: Properties };
}

// ── Parser helpers ────────────────────────────────────────────────────────────

interface ParsedHeader {
  depth: number;
  number: number;
  rest: string; // remaining text after "@N. " prefix
}

const parseHeaderPrefix = (text: string): ParsedHeader | null => {
  const m = STEP_HEADER_RE.exec(text);
  if (!m) return null;
  return { depth: m[1]!.length, number: parseInt(m[2]!, 10), rest: m[3]! };
};

// Convert body inline lines (PhrasingContent[][] with null separators for blank lines)
// into MDAST block children (paragraphs separated by blank lines).
const bodyLinesToBlocks = (
  lines: (PhrasingContent[] | null)[],
): (BlockContent | DefinitionContent)[] => {
  const blocks: (BlockContent | DefinitionContent)[] = [];
  let current: PhrasingContent[] = [];

  const flush = () => {
    if (current.length > 0) {
      blocks.push({ type: "paragraph", children: current } satisfies Paragraph);
      current = [];
    }
  };

  for (const line of lines) {
    if (line === null) {
      flush();
    } else if (line.length > 0) {
      // Add a softbreak between consecutive non-blank lines within a paragraph
      if (current.length > 0) current.push({ type: "text", value: "\n" });
      current.push(...line);
    }
  }

  flush();
  return blocks;
};

// ── Paragraph-level extraction ────────────────────────────────────────────────

interface RawStep {
  depth: number;
  number: number;
  titleNodes: PhrasingContent[];
  // Body stored as inline-node lines; null = blank line (paragraph separator)
  bodyLines: (PhrasingContent[] | null)[];
}

// Expand a paragraph's inline children into line-delimited segments by splitting
// text nodes on "\n". Returns an array of lines, each being an array of inline nodes.
const paraToLines = (para: Paragraph): PhrasingContent[][] => {
  type Segment = PhrasingContent | null; // null = line boundary
  const segments: Segment[] = [];

  for (const child of para.children) {
    if (child.type === "text") {
      const parts = child.value.split("\n");
      for (let p = 0; p < parts.length; p++) {
        if (p > 0) segments.push(null);
        if (parts[p] !== "") segments.push({ type: "text", value: parts[p]! });
      }
    } else if (child.type === "break") {
      segments.push(null);
    } else {
      segments.push(child);
    }
  }

  const lines: PhrasingContent[][] = [[]];
  for (const seg of segments) {
    if (seg === null) lines.push([]);
    else lines[lines.length - 1]!.push(seg);
  }
  return lines;
};

const extractFromParagraph = (para: Paragraph): RawStep[] | null => {
  const lines = paraToLines(para);
  const steps: RawStep[] = [];
  const counters = new Map<number, number>();
  let currentDepth = 0;
  let currentStep: RawStep | null = null;

  const flush = () => {
    if (currentStep) steps.push(currentStep);
  };

  for (const lineSegments of lines) {
    const firstNode = lineSegments[0];

    if (firstNode?.type === "text") {
      const header = parseHeaderPrefix(firstNode.value);
      if (header) {
        flush();
        const { depth } = header;
        if (depth > currentDepth + 1) return null; // depth jump — invalid
        for (const k of counters.keys()) if (k > depth) counters.delete(k);
        const number = (counters.get(depth) ?? 0) + 1;
        counters.set(depth, number);
        currentDepth = depth;

        const titleNodes: PhrasingContent[] = [];
        if (header.rest) titleNodes.push({ type: "text", value: header.rest });
        titleNodes.push(...lineSegments.slice(1));

        currentStep = { depth, number, titleNodes, bodyLines: [] };
        continue;
      }

      // Continuation line: strip "| " prefix and one optional leading space from first text
      if (currentStep !== null && CONTINUATION_RE.test(firstNode.value)) {
        const stripped = firstNode.value.replace(CONTINUATION_RE, "").replace(/^ /, "");
        const lineNodes: PhrasingContent[] = stripped
          ? [{ type: "text", value: stripped }, ...lineSegments.slice(1)]
          : lineSegments.slice(1);
        currentStep.bodyLines.push(lineNodes.length > 0 ? lineNodes : []);
        continue;
      }
    }

    // Empty line (all segments empty) — blank line separator
    if (currentStep !== null && lineSegments.length === 0) {
      currentStep.bodyLines.push(null);
      continue;
    }
  }

  flush();
  return steps.length > 0 ? steps : null;
};

// ── Tree builder ──────────────────────────────────────────────────────────────

const buildTree = (
  steps: RawStep[],
  targetDepth: number,
  start: number,
  end: number,
): StepsListNode => {
  const items: StepsItemNode[] = [];
  let i = start;

  while (i < end) {
    const s = steps[i]!;
    if (s.depth !== targetDepth) {
      i++;
      continue;
    }

    let childEnd = i + 1;
    while (childEnd < end && steps[childEnd]!.depth > targetDepth) childEnd++;

    const bodyChildren = bodyLinesToBlocks(s.bodyLines) as StepsItemNode["children"];
    const hasDeeper = steps.slice(i + 1, childEnd).some((ss) => ss.depth === targetDepth + 1);
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
      data: { attrsRole: "listItem", attrsTitle: s.titleNodes },
    });

    i = childEnd;
  }

  return { type: "stepsList", depth: targetDepth, children: items, data: { attrsRole: "list" } };
};

// ── Remark plugin ─────────────────────────────────────────────────────────────

export const remarkSteps: Plugin<[StepsOptions?], Root> = function (options = {}) {
  const { containerClass = "markdown-steps" } = options;

  return (tree) => {
    const newChildren: Root["children"] = [];
    let i = 0;

    while (i < tree.children.length) {
      const node = tree.children[i]!;

      if (node.type === "paragraph") {
        const firstChild = node.children[0];
        if (firstChild?.type === "text" && parseHeaderPrefix(firstChild.value)?.depth === 1) {
          const steps = extractFromParagraph(node);
          if (steps && steps.length > 0) {
            const list = buildTree(steps, 1, 0, steps.length);
            list.containerClass = containerClass;
            newChildren.push(list as unknown as Root["children"][number]);
            i++;
            continue;
          }
        }
      }

      newChildren.push(node);
      i++;
    }

    tree.children = newChildren;
  };
};

// ── HAST handlers ─────────────────────────────────────────────────────────────

const buildListHast = (list: StepsListNode, containerClass: string, state: State): Element => {
  const items: ElementContent[] = list.children.map((item) => {
    const liChildren: ElementContent[] = [];

    if (item.title.length > 0) {
      liChildren.push({
        type: "element",
        tagName: "p",
        properties: { class: `${containerClass}-title` } as Properties,
        children: state.all({
          type: "paragraph",
          children: item.title,
        } as Parameters<typeof state.all>[0]),
      });
    }

    const bodyBlocks = item.children.filter(
      (c) => (c as unknown as { type: string }).type !== "stepsList",
    ) as (BlockContent | DefinitionContent)[];
    const nestedLists = item.children.filter(
      (c) => (c as unknown as { type: string }).type === "stepsList",
    ) as unknown as StepsListNode[];

    if (bodyBlocks.length > 0) {
      liChildren.push({
        type: "element",
        tagName: "div",
        properties: { class: `${containerClass}-body` } as Properties,
        children: state.all({
          type: "root",
          children: bodyBlocks,
        } as Parameters<typeof state.all>[0]),
      });
    }

    for (const nested of nestedLists) {
      liChildren.push(buildListHast(nested, containerClass, state));
    }

    const liProps: Properties = {
      class: `${containerClass}-item`,
      "data-step": String(item.number),
    };
    if (item.data?.hProperties) {
      const { class: extraClass, ...rest } = item.data.hProperties;
      if (extraClass) liProps.class = `${liProps.class} ${extraClass}`;
      Object.assign(liProps, rest);
    }

    return {
      type: "element",
      tagName: "li",
      properties: liProps,
      children: liChildren,
    } satisfies Element;
  });

  // Root list uses containerClass directly; nested lists use containerClass-list
  const baseClass = list.depth === 1 ? containerClass : `${containerClass}-list`;
  const olProps: Properties = { class: baseClass };
  if (list.data?.hProperties) {
    const { class: extraClass, ...rest } = list.data.hProperties;
    if (extraClass) olProps.class = `${olProps.class} ${extraClass}`;
    Object.assign(olProps, rest);
  }

  return {
    type: "element",
    tagName: "ol",
    properties: olProps,
    children: items,
  };
};

export const stepsHastHandlers = {
  stepsList(state: State, node: StepsListNode): ElementContent {
    const containerClass = node.containerClass ?? "markdown-steps";
    const result = buildListHast(node, containerClass, state);
    state.patch(node as unknown as Parameters<typeof state.patch>[0], result);
    return result;
  },
} as const;
