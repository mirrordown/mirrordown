// Recognition for numbered step sequences, shared by the remark and Sätteri plugins: header lines (`@1. Title`) and their `>` bodies become `stepsList`/`stepsItem` nodes, which each engine then renders. It rewrites mdast in place, so a read-only engine runs it on a copy.
// This module performs heavy tree-rewriting across mdast/hast types that don't unify cleanly; type assertions bridging those boundaries are reviewed and intentional, so the rule is disabled file-wide rather than per-cast. Defensive optional chains on array[i] accesses are also kept because TS doesn't model index access as fallible.
/* oxlint-disable typescript/no-unsafe-type-assertion */
/* oxlint-disable typescript/no-unnecessary-condition */
import type {
  Root,
  Paragraph,
  Blockquote,
  Text,
  PhrasingContent,
  BlockContent,
  DefinitionContent
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
  linesToParagraph,
  markerCount,
  paragraphProperties,
  paraToLines,
  paraToSourceLines,
  quotePosition,
  rebuildLazyLines,
  splitSourceLines,
  type SourceLine
} from "./lazy.js";
import { isAlertMarkerLine } from "./github-alerts/index.js";

// Groups: 1=@ string (depth), 2=number, 3=rest of line (may be empty or title text)
const STEP_HEADER_RE = /^(@{1,6})(\d+)\. ?(.*)/s;

// ── MDAST node types ──────────────────────────────────────────────────────────

/** A list of steps at one depth, rendered as an `<ol>`. */
export interface StepsListNode {
  type: "stepsList";
  depth: number;
  containerClass?: string;
  /** A group written in a step's body (`@1.` with the body's `>`), which renders in the body, rather than the step's `@@` sub-steps. */
  inBody?: boolean;
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
    /** A sub-step (`@@` and deeper): its body is written with its parent step's `>` markers, not with one more, which is how the lazy-line passes count its lines (see `markerLevels`). */
    sub?: boolean;
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

// A step header as written. Recognition reads text values, where an escape (`\@1.`) or a character reference (`&#64;1.`) has become the character it stands for; markdown-it reads the line, where those are not a header. So with the source, the text must start with a header there too.
const SOURCE_HEADER_RE = /^@{1,6}\d+\./;

const writtenHeader = (
  text: Text,
  sourceLines?: readonly string[]
): ParsedHeader | null => {
  const header = parseHeaderPrefix(text.value);
  const start = text.position?.start;
  if (!header || !sourceLines || !start) return header;
  const source = (sourceLines[start.line - 1] ?? "").slice(start.column - 1);
  return SOURCE_HEADER_RE.test(source) ? header : null;
};

// ── Raw step types ────────────────────────────────────────────────────────────

interface RawStep {
  depth: number;
  number: number;
  titleNodes: PhrasingContent[];
  body: Array<BlockContent | DefinitionContent>;
  // Attributes the parser read off the end of the header's paragraph, when the header ended it (Sätteri).
  hProperties?: Properties | undefined;
}

// ── Paragraph line splitting ──────────────────────────────────────────────────

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
  // Attributes the parser read off the end of the paragraph (Sätteri) from a block on a line of its own after the last header: written after the steps, they are the list's, as the attrs plugins of the other engines place them.
  listProperties?: Properties | undefined;
}

const extractHeaderPara = (
  para: Paragraph,
  counters: Map<number, number>,
  requireDepthOne = true,
  prevDepth = 0,
  sourceLines?: readonly string[]
): HeaderPara | null => {
  const lines = paraToLines(para, sourceLines);
  const steps: RawStep[] = [];
  let currentDepth = prevDepth;
  // Whether the paragraph goes on past its last line's text: the parser took an attribute block from a line of its own.
  const lastText = lines.at(-1)?.at(-1)?.position?.end.line;
  const ownLine =
    lastText !== undefined && (para.position?.end.line ?? lastText) > lastText;
  const stop = (index: number): HeaderPara | null =>
    steps.length > 0
      ? {
          steps,
          rest: lines.slice(index),
          restLine: (para.position?.start.line ?? 1) + index
        }
      : null;

  for (const [index, line] of lines.entries()) {
    const lineSegs = headerLineContent(line, sourceLines);
    const first = lineSegs[0];
    if (first?.type !== "text") return stop(index);

    const header = writtenHeader(first, sourceLines);
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

    steps.push({
      depth,
      number,
      titleNodes,
      body: [],
      ...(index === lines.length - 1 && !ownLine
        ? { hProperties: paragraphProperties(para) }
        : {})
    });
  }

  const all = stop(lines.length);
  return all && ownLine
    ? { ...all, listProperties: paragraphProperties(para) }
    : all;
};

// Lines left over after a group ends become ordinary paragraphs, split before
// every line that opens a new group (a depth-1 header), so the main loop can
// start that group. Positions follow the source lines (paragraph lines map 1:1
// to source lines) because group ids hash the start line.
const splitAtGroupStarts = (
  lines: PhrasingContent[][],
  firstLine: number,
  sourceLines?: readonly string[]
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
      first?.type === "text" && writtenHeader(first, sourceLines)?.depth === 1;
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

interface ParentLike {
  type: string;
  children?: ParentLike[];
}

// CommonMark lets a line without a blockquote's `>` markers continue the paragraph before it, so lines meant for the next step can end up in a paragraph nested in a step's body (in a deeper blockquote or a list item), where markdown-it reads them by their markers instead. From the deepest last paragraph of `node`, take the lines from the first one written outside the step body (with fewer markers than the body's own, `base`) that `leaves` accepts (given the paragraph's lines and the line's index); the paragraph is cut before it, in place.
const takeLazyLines = (
  node: BlockContent | DefinitionContent,
  sourceLines: readonly string[],
  base: number,
  leaves: (lines: readonly SourceLine[], index: number) => boolean
): SourceLine[] | null => {
  let parent = node as unknown as ParentLike;
  let last = parent.children?.at(-1);
  while (last?.type !== "paragraph") {
    if (!last?.children?.length) return null;
    parent = last;
    last = parent.children?.at(-1);
  }
  const para = last as unknown as Paragraph;
  const lines = paraToSourceLines(para, sourceLines);
  if (!lines || !parent.children) return null;
  const at = lines.findIndex(
    ({ markers }, index) => index > 0 && markers < base && leaves(lines, index)
  );
  if (at === -1) return null;
  const kept = linesToParagraph(
    lines.slice(0, at).map(({ segs }) => segs),
    sourceLines
  );
  parent.children.splice(
    -1,
    1,
    ...(kept ? [kept as unknown as ParentLike] : [])
  );
  return lines.slice(at);
};

interface SplitQuote {
  segments: BQSegment[];
  // The blocks after the group, when a line in the quote ended it: that line and what follows it, as markdown-it parses them once the group has ended.
  after: Array<BlockContent | DefinitionContent> | null;
  // Whether such a line was left in the last body, for the pass that ends groups at their markers to move: the group has ended there all the same, so nothing after the quote continues it.
  ended: boolean;
}

const splitBlockquote = (
  bq: Blockquote,
  counters: Map<number, number>,
  currentDepth: number,
  sourceLines?: readonly string[]
): SplitQuote => {
  const segments: BQSegment[] = [];
  let currentSegment: BQSegment = { header: null, body: [] };
  // The `>` markers of the step body's own lines.
  const base = sourceLines ? blockquoteMarkers(bq, sourceLines) : undefined;
  // The lines that ended the group, and the quote's blocks after their paragraph.
  let ending: SourceLine[] | null = null;
  const quoted: Array<BlockContent | DefinitionContent> = [];
  // The data of the paragraph the group ended in: attributes the parser read from its end (Sätteri's run before steps), which belong to its last line.
  let endingData: Paragraph["data"];
  // Whether a line that ends the group was left in a body (see `endsGroup`).
  let ended = false;
  const outside = (line: SourceLine | undefined): boolean =>
    base !== undefined && line !== undefined && line.markers < base;

  // A line's step header, if it has one that fits the group's depth.
  const stepHeader = (lineSegs: PhrasingContent[]): ParsedHeader | null => {
    const first = lineSegs[0];
    if (first?.type !== "text") return null;
    const header = writtenHeader(first, sourceLines);
    return header && header.depth <= currentDepth + 1 ? header : null;
  };

  const startStep = (
    header: ParsedHeader,
    lineSegs: PhrasingContent[],
    hProperties?: Properties
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
      header: { depth: header.depth, number, titleNodes, hProperties },
      body: []
    };
  };

  // A line that is neither a header nor written with the body's markers ends the group, as it does in markdown-it. Here, that's one the pass that ends groups at their markers (`endGroupsAtMarkers`) doesn't reach: the `first` line after a header (that pass reads a paragraph from its second line), a line with a header after it (it isn't in the group's last step then), or a line with a block after its paragraph (it isn't in the body's last paragraph: not the quote's `last`). The other such lines are left to that pass. Tabs end a group the same way (`splitBlockquote` in tabs.ts).
  const endsGroup = (
    lines: readonly SourceLine[],
    index: number,
    first: boolean,
    last: boolean
  ): boolean =>
    base !== undefined &&
    (lines[index]?.markers ?? base) < base &&
    (first ||
      !last ||
      lines.some(
        (line, later) =>
          later > index &&
          line.markers < base &&
          stepHeader(headerLineContent(line.segs, sourceLines)) !== null
      ));

  for (const [childIndex, child] of bq.children.entries()) {
    // After the group has ended, the quote's other blocks follow it as they are.
    if (ending) {
      quoted.push(child);
      continue;
    }
    const last = childIndex === bq.children.length - 1;
    if (child.type !== "paragraph") {
      currentSegment.body.push(child);
      if (!sourceLines || base === undefined) continue;
      const lazy = takeLazyLines(child, sourceLines, base, (lines, index) => {
        const leaves =
          stepHeader(lines[index]?.segs ?? []) !== null ||
          endsGroup(lines, index, false, last);
        if (!leaves) ended = true;
        return leaves;
      });
      if (!lazy) continue;
      // The header and the lines after it: the steps they start, and those steps' bodies.
      let pending: SourceLine[] = [];
      const flush = (): void => {
        const relative = pending.map((line) => ({
          ...line,
          markers: line.markers - base
        }));
        currentSegment.body.push(...rebuildLazyLines(relative, 0));
        pending = [];
      };
      for (const [index, line] of lazy.entries()) {
        const content = headerLineContent(line.segs, sourceLines);
        const header = line.markers < base ? stepHeader(content) : null;
        if (header) {
          flush();
          startStep(header, content);
        } else if (endsGroup(lazy, index, pending.length === 0, last)) {
          ending = lazy.slice(index);
          break;
        } else {
          if (outside(line)) ended = true;
          pending.push(line);
        }
      }
      flush();
      continue;
    }

    let bodyLines: PhrasingContent[][] = [];
    const marked = sourceLines ? paraToSourceLines(child, sourceLines) : null;
    const lines = marked
      ? marked.map(({ segs }) => segs)
      : paraToLines(child, sourceLines);
    // A header written with the body's own `>` markers is the body's content (it can start a group of its own there), as markdown-it reads the body; only one written outside the body starts the next step.
    const outsideBody = (index: number): boolean =>
      !marked || base === undefined || (marked[index]?.markers ?? 0) < base;
    for (const [index, lineSegs] of lines.entries()) {
      const content = headerLineContent(lineSegs, sourceLines);
      const header = outsideBody(index) ? stepHeader(content) : null;
      if (header) {
        // Flush accumulated body lines
        const bodyPara = linesToParagraph(bodyLines, sourceLines);
        if (bodyPara) currentSegment.body.push(bodyPara);
        bodyLines = [];
        startStep(
          header,
          content,
          index === lines.length - 1 ? paragraphProperties(child) : undefined
        );
        continue;
      }
      if (marked && endsGroup(marked, index, bodyLines.length === 0, last)) {
        ending = marked.slice(index);
        break;
      }
      if (outside(marked?.[index])) ended = true;
      bodyLines.push(lineSegs);
    }

    // These lines end the paragraph, so they keep its data: attributes the
    // parser read from its end (Sätteri's run before steps). When the group ended in the paragraph, the lines that ended it do.
    const bodyPara = linesToParagraph(
      bodyLines,
      ending ? sourceLines : undefined
    );
    if (bodyPara && child.data && !ending) bodyPara.data = child.data;
    if (bodyPara) currentSegment.body.push(bodyPara);
    if (ending) endingData = child.data;
  }

  segments.push(currentSegment);
  if (!ending || !sourceLines || base === undefined)
    return { segments, after: null, ended };

  // The lines that ended the group, rebuilt from their markers over those of the content around the group (one fewer than the body's), with the quote's later blocks still quoted.
  const over = base - 1;
  const after = rebuildLazyLines(
    ending.map((line) => ({ ...line, markers: line.markers - over })),
    0,
    { sourceLines, over }
  );
  if (endingData) {
    let block = after.at(-1);
    while (block?.type === "blockquote") block = block.children.at(-1);
    if (block?.type === "paragraph") block.data = endingData;
  }
  const firstQuoted = quoted[0];
  if (firstQuoted) {
    const lastRebuilt = after.at(-1);
    if (lastRebuilt?.type === "blockquote")
      lastRebuilt.children.push(...quoted);
    else {
      const quote: Blockquote = { type: "blockquote", children: quoted };
      const from = firstQuoted.position?.start.line;
      const to = quoted.at(-1)?.position?.end.line;
      const position =
        from !== undefined && to !== undefined
          ? quotePosition(sourceLines, from, to, base)
          : undefined;
      if (position) quote.position = position;
      after.push(quote);
    }
  }
  return { segments, after, ended: true };
};

// Whether a quote after a step is an alert (`> [!NOTE]`), a block of its own, rather than more of the step's body. After a blank line it is, as markdown-it reads it, whether or not the alerts plugin reads it. Directly under the step it is the body, unless the alerts plugin (it runs before steps) has already made it an alert, taking its marker: that can't be made a body again. Only a marker with the quote's own `>` count counts: written deeper (`> > [!NOTE]`), it's an alert in the body.
const isOwnAlert = (
  bq: Blockquote,
  before: Paragraph["position"],
  sourceLines: readonly string[]
): boolean => {
  const line = bq.position?.start.line;
  if (line === undefined) return false;
  const source = sourceLines[line - 1] ?? "";
  if (
    !isAlertMarkerLine(source) ||
    markerCount(source) !== blockquoteMarkers(bq, sourceLines)
  )
    return false;
  if (before && line > before.end.line + 1) return true;
  const text =
    bq.children[0]?.type === "paragraph" && bq.children[0].children[0];
  return !(text && text.type === "text" && isAlertMarkerLine(text.value));
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
      data: {
        attrsRole: "containerItem",
        attrsTitle: s.titleNodes,
        ...(targetDepth > 1 ? { sub: true } : {}),
        ...(s.hProperties ? { hProperties: { ...s.hProperties } } : {})
      }
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

    // A step header interrupts the paragraph before it, as markdown-it's block rule does, when it's written at the paragraph's own level (its `>` markers). In a list item, a header line may instead be one CommonMark lazily continued, written short of the item's content: only one written in the item interrupts. In a definition, where the content's column isn't known, they are left as they are.
    if (
      node.type === "paragraph" &&
      sourceLines &&
      (column !== undefined || !INDENTED_BLOCKS.has(parentType))
    ) {
      const split = splitAtOpeningLine(
        node,
        sourceLines,
        quotes,
        (_, text) => writtenHeader(text, sourceLines)?.depth === 1,
        column
      );
      if (split) {
        children.splice(i, 1, ...split);
        continue;
      }
    }

    if (node.type === "paragraph") {
      const counters = new Map<number, number>();
      const headerPara = extractHeaderPara(
        node,
        counters,
        true,
        0,
        sourceLines
      );

      if (headerPara) {
        const rawSteps: RawStep[] = [...headerPara.steps];
        // Lines left over after a depth-skipping or non-header line end the group.
        let rest = headerPara.rest;
        let restLine = headerPara.restLine;
        let listProperties = headerPara.listProperties;
        let j = i + 1;
        // A group always starts with at least one step.
        const lastStep = (): RawStep => rawSteps[rawSteps.length - 1]!;
        let currentStepIdx = rawSteps.length - 1;
        let currentDepth = lastStep().depth;

        while (rest.length === 0 && j < children.length) {
          const sibling = children[j];
          if (!sibling) break;

          if (sibling.type === "blockquote") {
            if (
              sourceLines &&
              isOwnAlert(sibling, children[j - 1]?.position, sourceLines)
            )
              break;
            const { segments, after, ended } = splitBlockquote(
              sibling,
              counters,
              currentDepth,
              sourceLines
            );

            const firstSeg = segments[0];
            if (firstSeg?.header === null) {
              rawSteps[currentStepIdx]?.body.push(...firstSeg.body);
            }
            // Attributes on the quote itself (Sätteri) come from a block on a line of its own, written after the body without its `>`: that line ends the steps, and its attributes are the list's.
            const quoteProperties = paragraphProperties(
              sibling as unknown as Paragraph
            );

            for (let s = 1; s < segments.length; s++) {
              const seg = segments[s];
              if (seg?.header) {
                rawSteps.push({ ...seg.header, body: seg.body });
                currentStepIdx = rawSteps.length - 1;
                currentDepth = seg.header.depth;
              }
            }

            j++;
            // A line in the quote ended the group: it and what follows it come after the list, where the loop reads them as it reads any block (a header among them starts a new group).
            if (after) {
              // The quote's attributes were written after its last line, which is now in the last of these blocks.
              const lastBlock = after.at(-1);
              if (quoteProperties && lastBlock)
                lastBlock.data = {
                  ...lastBlock.data,
                  hProperties: { ...quoteProperties }
                } as typeof lastBlock.data;
              children.splice(j, 0, ...after);
              break;
            }
            // A line in the quote ended the group and was left for the pass that ends groups at their markers: the quote's attributes were written after that line, so they go where that pass puts its blocks.
            if (ended) {
              if (quoteProperties)
                keepQuoteAttributes(lastStep().body, quoteProperties);
              break;
            }
            if (quoteProperties) {
              listProperties = { ...listProperties, ...quoteProperties };
              break;
            }
          } else if (sibling.type === "paragraph") {
            const prevDepth = lastStep().depth;
            const contHeaders = extractHeaderPara(
              sibling,
              counters,
              false,
              prevDepth,
              sourceLines
            );
            if (contHeaders) {
              rawSteps.push(...contHeaders.steps);
              rest = contHeaders.rest;
              restLine = contHeaders.restLine;
              listProperties = contHeaders.listProperties ?? listProperties;
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
        if (parentType === "stepsItem") list.inBody = true;
        if (listProperties)
          list.data = { ...list.data, hProperties: { ...listProperties } };
        newChildren.push(list as unknown as Root["children"][number]);
        children.splice(
          j,
          0,
          ...splitAtGroupStarts(rest, restLine, sourceLines)
        );
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
 * Turn every step sequence in `root` into `stepsList` nodes, at the top level and inside any container (blockquotes, list items, tab panels…), walking into the lists it builds so nested sequences are found too. With the document's `source`, a step header that CommonMark lazily continued into a nested paragraph is recognized too, as markdown-it reads it.
 */
export const processSteps = (
  root: Root,
  containerClass: string,
  source?: string
): void => {
  const sourceLines =
    source === undefined ? undefined : splitSourceLines(source);
  const walk = (node: Container, quotes: number): void => {
    if (!Array.isArray(node.children) || node.children.length === 0) return;
    const inner = quotes + markerLevels(node);
    processStepsInChildren(
      node.children as Array<BlockContent | DefinitionContent>,
      containerClass,
      sourceLines,
      inner,
      node.type,
      itemContentColumn(node)
    );
    for (const child of node.children) walk(child as Container, inner);
  };
  processStepsInChildren(root.children, containerClass, sourceLines);
  for (const child of root.children) walk(child, 0);
  if (sourceLines) endGroupsAtMarkers(root, sourceLines, `stepsList`);
};
