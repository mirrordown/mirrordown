// Lazy continuation, shared by the steps and tabs recognition: CommonMark lets a line without a blockquote's `>` markers continue the paragraph before it, so a header meant for an outer group, and the lines after it, can end up in a paragraph nested in a body. markdown-it reads such lines by their markers instead; with the document's source, so does recognition.
import type {
  Blockquote,
  BlockContent,
  DefinitionContent,
  PhrasingContent
} from "mdast";

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

/** A paragraph from lines of phrasing content, or `null` for none. */
export const linesToParagraph = (
  lines: PhrasingContent[][]
): { type: "paragraph"; children: PhrasingContent[] } | null => {
  const children: PhrasingContent[] = [];
  for (const [i, line] of lines.entries()) {
    if (i > 0) children.push({ type: "text", value: "\n" });
    children.push(...line);
  }
  return children.length > 0 ? { type: "paragraph", children } : null;
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
