// Which blocks a line is written in, by its source prefix: a line that lazily continues a paragraph has fewer `>` markers, or less indentation, than the blocks around that paragraph. The same rule as mdit-attrs' and remd-attrs' own-line attributes, for the plugins in this module's callers.

/**
 * A block a line can be written in, outermost first: a blockquote (or another block written with `>` markers, such as a tab panel), by how many `>` markers lead up to its own, or a list item (or a definition), by the column its content starts at.
 */
export type LineContainer =
  | { kind: `quote`; markers: number }
  | { kind: `item`; column: number };

/**
 * How many of `containers`, outermost first, a line is written in. Tabs count as one column.
 */
export const containersKept = (
  line: string,
  containers: readonly LineContainer[]
): number => {
  const prefix = /^[ \t>]*/.exec(line)?.[0] ?? ``;
  const markers = prefix.split(`>`).length - 1;
  let kept = 0;
  for (const container of containers) {
    if (
      container.kind === `quote`
        ? markers < container.markers
        : prefix.length < container.column
    )
      break;
    kept++;
  }
  return kept;
};

/**
 * The columns the content of the list items opened on a line starts at, in the order they open, as CommonMark reads a list marker: up to four spaces after it belong to the marker, more start indented content one column after.
 */
export const itemColumns = (line: string): number[] => {
  const columns: number[] = [];
  let pos = 0;
  for (;;) {
    while (line[pos] === ` ` || line[pos] === `\t`) pos++;
    if (line[pos] === `>`) {
      pos++;
      continue;
    }
    const marker = /^(?:[-+*]|\d{1,9}[.)])(?=[ \t]|$)/.exec(line.slice(pos));
    if (!marker) return columns;
    const end = pos + marker[0].length;
    let spaces = 0;
    while (line[end + spaces] === ` ` || line[end + spaces] === `\t`) spaces++;
    const column =
      end + spaces === line.length || spaces > 4 ? end + 1 : end + spaces;
    columns.push(column);
    if (spaces > 4) return columns;
    pos = column;
  }
};
