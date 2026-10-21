/**
 * A block a line can be written in, outermost first: a blockquote, by how many
 * `>` markers lead up to its own, or a list item, by the column its content
 * starts at.
 */
export type LineContainer =
  | { kind: "quote"; markers: number }
  | { kind: "item"; column: number };

/**
 * How many of `containers`, outermost first, a line is written in: a line that
 * lazily continues a paragraph has fewer `>` markers, or less indentation,
 * than the blocks around that paragraph. Tabs count as one column.
 */
export const containersKept = (
  line: string,
  containers: readonly LineContainer[]
): number => {
  const prefix = /^[ \t>]*/.exec(line)?.[0] ?? "";
  const markers = prefix.split(">").length - 1;
  let kept = 0;
  for (const container of containers) {
    if (
      container.kind === "quote"
        ? markers < container.markers
        : prefix.length < container.column
    )
      break;
    kept++;
  }
  return kept;
};
