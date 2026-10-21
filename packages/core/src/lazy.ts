// Lazy continuation, shared by the steps and tabs recognition: CommonMark lets a line without a blockquote's `>` markers continue the paragraph before it, so a header meant for an outer group, and the lines after it, can end up in a paragraph nested in a body. markdown-it reads such lines by their markers instead; with the document's source, so does recognition.
import type {
  Blockquote,
  BlockContent,
  DefinitionContent,
  Paragraph,
  PhrasingContent,
  Text
} from "mdast";
import { rebuiltParagraphs } from "./cut-attributes.js";

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

/**
 * A paragraph's phrasing content split into its lines: text at each line ending, and after a hard break, which stays at the end of its line. With the source, the text on each line keeps its place in it, as remark would give it: from after the line's container prefix to its last non-space character.
 */
export const paraToLines = (
  para: Paragraph,
  sourceLines?: readonly string[]
): PhrasingContent[][] => {
  const lines: PhrasingContent[][] = [[]];
  for (const child of para.children) {
    if (child.type === "break") {
      lines.at(-1)?.push(child);
      lines.push([]);
    } else if (child.type === "text") {
      const parts = child.value.split("\n");
      for (const [p, part] of parts.entries()) {
        if (p > 0) lines.push([]);
        if (part === "") continue;
        const text: Text = { type: "text", value: part };
        const position = child.position;
        if (position) {
          const line = position.start.line + p;
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
        lines.at(-1)?.push(text);
      }
    } else {
      lines.at(-1)?.push(child);
    }
  }
  return lines;
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

/** A paragraph from lines of phrasing content, or `null` for none. Lines join with a line ending, except after a hard break, which is one. */
export const linesToParagraph = (
  lines: PhrasingContent[][]
): Paragraph | null => {
  const children: PhrasingContent[] = [];
  for (const [i, line] of lines.entries()) {
    if (i > 0 && lines[i - 1]?.at(-1)?.type !== "break")
      pushPhrasing(children, { type: "text", value: "\n" });
    for (const node of line) pushPhrasing(children, node);
  }
  if (children.length === 0) return null;
  const para: Paragraph = { type: "paragraph", children };
  const start = children[0]?.position?.start;
  const end = children.at(-1)?.position?.end;
  if (start && end) para.position = { start, end };
  rebuiltParagraphs.add(para);
  return para;
};

/**
 * The blocks lazily continued lines stand for, from their markers relative to the body they belong to (`level` deep): as such lines go on CommonMark only nests deeper, so a line with more markers opens blockquotes and a new paragraph, and a line with fewer continues the paragraph it follows.
 */
export const rebuildLazyLines = (
  lines: MarkedLine[],
  level: number
): Array<BlockContent | DefinitionContent> => {
  const deeper = lines.findIndex(({ markers }) => markers > level);
  const own = deeper === -1 ? lines : lines.slice(0, deeper);
  const para = linesToParagraph(own.map(({ segs }) => segs));
  const blocks: Array<BlockContent | DefinitionContent> = para ? [para] : [];
  if (deeper !== -1) {
    const quote: Blockquote = {
      type: "blockquote",
      children: rebuildLazyLines(lines.slice(deeper), level + 1)
    };
    blocks.push(quote);
  }
  return blocks;
};
