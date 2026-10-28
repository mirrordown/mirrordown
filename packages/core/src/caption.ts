// Captions (`~: caption` on the line right after a block), shared by the markdown-it, remark and Sätteri plugins. CommonMark parses a caption line differently depending on what it follows: after a fence it starts a paragraph of its own; after an image, or lazily after a blockquote or list, it continues the paragraph before it; after a table it's a row. So the plugins find caption lines by their source, and the `>` markers and indentation a line is written with decide which block it captions, as attrs places a block on a line of its own. `processCaptions` does this for an mdast tree (remark, and Sätteri through `editableTree`); markdown-it shares the line rules.
// Recognition walks mdast and the custom nodes other plugins build (tab groups, steps, alerts) through one loose node shape; the assertions bridging it and mdast's types are reviewed and intentional.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import type { PhrasingContent, Root } from "mdast";
import type { Properties } from "hast";
import { isAlertMarkerLine } from "./github-alerts/index.js";
import { linesToParagraph, paraToLines } from "./lazy.js";
import { containersKept, type LineContainer } from "./line-containers.js";

/** The class of the `<figure>` a caption wraps its block in. */
export const CAPTION_CLASS = "markdown-caption";

/** Whether a source line is a caption line: `~:`, whitespace and the caption's first word after its `>` markers and indentation. An escaped `\~:` isn't one, nor is a marker with nothing after it. */
export const isCaptionLine = (line: string): boolean =>
  /^~:[ \t]+\S/.test(line.replace(/^[ \t>]*/, ``));

/** Whether text starts with a caption marker, as a parser gives a caption line's text (inline markdown may follow in other nodes). */
export const startsCaption = (text: string): boolean =>
  /^~:(?:[ \t]|$)/.test(text);

/** The text after a caption marker. */
export const stripCaptionMarker = (text: string): string =>
  text.replace(/^~:[ \t]*/, ``);

/**
 * Blocks a caption doesn't attach to, by mdast (and custom node) type: a caption after them stays text. Headings, thematic breaks, raw HTML, definitions and front matter, another caption's figure, and the parts of containers that aren't blocks of their own (titles, labels, terms).
 */
const UNCAPTIONED = new Set([
  `heading`,
  `thematicBreak`,
  `html`,
  `definition`,
  `footnoteDefinition`,
  `yaml`,
  `toml`,
  `figure`,
  `alertTitle`,
  `stepsTitle`,
  `tabsLabel`,
  `tabsLabels`,
  `tabsInput`,
  `defListTerm`,
  `descriptionTerm`
]);

/** The properties of a caption's `<figure>`: its class, then the attributes written at the end of the caption (a class joins it). */
export const figureProperties = (author?: Properties): Properties => {
  const {
    class: extraClass,
    className: extraClassName,
    ...rest
  } = author ?? {};
  const extra = [extraClass, extraClassName]
    .flat()
    .flatMap((value) => (typeof value === `string` ? value.split(` `) : []))
    .filter((value) => value !== ``);
  return { className: [CAPTION_CLASS, ...extra], ...rest };
};

interface Point {
  line: number;
  column: number;
}
interface Node {
  type: string;
  children?: Node[];
  position?: { start: Point; end: Point };
  data?: { hProperties?: Properties } & Record<string, unknown>;
  value?: string;
}

const WHITESPACE = /^\s*$/;

// Only images (each possibly inside a link) and whitespace: the figure holds them directly, as an image alone in its paragraph is the figure.
const onlyImages = (children: readonly Node[]): boolean =>
  children.some((child) => child.type !== `text`) &&
  children.every(
    (child) =>
      child.type === `image` ||
      (child.type === `text` && WHITESPACE.test(child.value ?? ``)) ||
      (child.type === `link` &&
        (child.children ?? []).length > 0 &&
        (child.children ?? []).every((inner) => inner.type === `image`))
  );

const figure = (
  content: Node[],
  caption: PhrasingContent[],
  author: Properties | undefined
): Node => ({
  type: `figure`,
  data: { hName: `figure`, hProperties: figureProperties(author) },
  children: [
    ...content,
    {
      type: `figcaption`,
      data: { hName: `figcaption` },
      children: caption as unknown as Node[]
    }
  ]
});

// A caption's lines as phrasing content, without the marker on the first.
const captionContent = (lines: PhrasingContent[][]): PhrasingContent[] => {
  const first = lines[0]?.[0];
  if (first?.type === `text`) {
    const value = stripCaptionMarker(first.value);
    lines[0] = value
      ? [{ ...first, value }, ...lines[0]!.slice(1)]
      : lines[0]!.slice(1);
  }
  return linesToParagraph(lines)?.children ?? [];
};

// The attributes a node carries, removed from it: those written at the end of a caption go on its figure.
const takeProperties = (node: Node): Properties | undefined => {
  const data = node.data;
  if (!data?.hProperties) return undefined;
  const { hProperties, ...rest } = data;
  node.data = rest;
  return hProperties;
};

/**
 * Wrap each captioned block of an mdast tree, with its caption, in a `figure` node (`hName: "figure"`, class `markdown-caption`) whose last child is a `figcaption` node. `source` is the document the tree was parsed from: caption lines are found, and placed, by their source lines.
 */
export const processCaptions = (root: Root, source: string): void => {
  if (!source.includes(`~:`)) return;
  const sourceLines = source.split(/\r?\n/);
  const parents = new Map<Node, Node>();
  const paragraphs: Node[] = [];
  const tables: Node[] = [];
  const walk = (node: Node): void => {
    if (node.type === `paragraph`) paragraphs.push(node);
    else if (node.type === `table`) tables.push(node);
    for (const child of node.children ?? []) {
      parents.set(child, node);
      walk(child);
    }
  };
  walk(root as unknown as Node);

  const replace = (node: Node, replacement: Node | null): void => {
    const parent = parents.get(node);
    const siblings = parent?.children;
    if (!parent || !siblings) return;
    const index = siblings.indexOf(node);
    if (index === -1) return;
    if (replacement) {
      siblings.splice(index, 1, replacement);
      parents.set(replacement, parent);
      parents.set(node, replacement);
    } else siblings.splice(index, 1);
  };
  const captioned = (node: Node): boolean =>
    parents.get(node)?.type === `figure`;

  const ancestorsOf = (node: Node): Node[] => {
    const ancestors: Node[] = [];
    for (let p = parents.get(node); p; p = parents.get(p)) ancestors.unshift(p);
    return ancestors;
  };

  // The blocks around a node a line can be written outside of, outermost first, with the block a caption written outside each goes on: a blockquote or alert itself, a tab panel's group, a step body's steps, a list item's list, a definition's list. `undefined` when a list item's content has no position to measure.
  const containersOf = (
    ancestors: readonly Node[]
  ): Array<{ target: Node; line: LineContainer }> | undefined => {
    const containers: Array<{ target: Node; line: LineContainer }> = [];
    const nearest = (index: number, type: string): Node | undefined =>
      ancestors
        .slice(0, index)
        .reverse()
        .find((a) => a.type === type);
    let quotes = 0;
    for (const [index, ancestor] of ancestors.entries()) {
      const quote = (target: Node | undefined): void => {
        containers.push({
          target: target ?? ancestor,
          line: { kind: `quote`, markers: ++quotes }
        });
      };
      switch (ancestor.type) {
        case `blockquote`:
        case `alert`:
          quote(ancestor);
          break;
        // A tab panel (remark builds `tabsItem`, Sätteri renders `tabsPanel`).
        case `tabsItem`:
        case `tabsPanel`:
          quote(nearest(index, `tabsList`));
          break;
        // A step body (Sätteri renders it as `stepsBody` inside its item).
        case `stepsItem`:
          if (!(ancestor.children ?? []).some((c) => c.type === `stepsBody`))
            quote(nearest(index, `stepsList`));
          break;
        case `stepsBody`:
          quote(nearest(index, `stepsList`));
          break;
        case `listItem`:
        case `defListDescription`:
        case `descriptionDetails`: {
          const column = ancestor.children?.[0]?.position?.start.column;
          if (column === undefined) return undefined;
          containers.push({
            target: ancestors[index - 1] ?? ancestor,
            line: { kind: `item`, column: column - 1 }
          });
          break;
        }
        default:
      }
    }
    return containers;
  };

  // Tables: a caption line is a row of its own; it and the rows after it are the caption.
  for (const table of tables) {
    const rows = table.children ?? [];
    const first = rows.findIndex((row, index) => {
      const line = row.position?.start.line;
      const text = row.children?.[0]?.children?.[0];
      return (
        index > 0 &&
        line !== undefined &&
        isCaptionLine(sourceLines[line - 1] ?? ``) &&
        text?.type === `text` &&
        startsCaption(text.value ?? ``)
      );
    });
    if (first === -1) continue;
    const captionRows = rows.slice(first);
    const lastCell = captionRows.at(-1)?.children?.[0];
    const author = lastCell ? takeProperties(lastCell) : undefined;
    const caption = captionContent(
      captionRows.map(
        (row) =>
          (row.children?.[0]?.children ?? []) as unknown as PhrasingContent[]
      )
    );
    table.children = rows.slice(0, first);
    replace(table, figure([table], caption, author));
  }

  // Paragraphs, innermost and last first, so a figure made inside a block is in place before the block is wrapped.
  for (const para of paragraphs.reverse()) {
    const first = para.position?.start.line;
    if (first === undefined) continue;
    const lines = paraToLines(
      para as unknown as Parameters<typeof paraToLines>[0],
      sourceLines
    );
    // Each line is one source line. An alert's first paragraph lost its marker line (`> [!NOTE]`) to the alert, which leaves its start there.
    const parent = parents.get(para);
    const alert =
      parent?.type === `alert` ||
      (parent?.type === `blockquote` && parent.data?.alertType !== undefined);
    const start =
      alert && isAlertMarkerLine(sourceLines[first - 1] ?? ``)
        ? first + 1
        : first;
    const isCaptionAt = (index: number): boolean => {
      const text = lines[index]?.[0];
      return (
        isCaptionLine(sourceLines[start + index - 1] ?? ``) &&
        text?.type === `text` &&
        startsCaption(text.value)
      );
    };

    // A paragraph that is a caption: it captions the block right before it, on the line above.
    if (isCaptionAt(0)) {
      const parent = parents.get(para);
      const siblings = parent?.children ?? [];
      const before = siblings[siblings.indexOf(para) - 1];
      const above = sourceLines[start - 2];
      if (
        !before ||
        UNCAPTIONED.has(before.type) ||
        above === undefined ||
        above.replace(/^[ \t>]*/, ``) === ``
      )
        continue;
      const author = takeProperties(para);
      replace(para, null);
      replace(before, figure([before], captionContent(lines), author));
      continue;
    }

    // A caption line inside the paragraph: the paragraph, or a block around it the line is written outside of.
    let containers: Array<{ target: Node; line: LineContainer }> | undefined;
    const segments: Array<{ index: number; kept: number; target: Node }> = [];
    for (let index = 1; index < lines.length; index++) {
      if (!isCaptionAt(index)) continue;
      containers ??= containersOf(ancestorsOf(para));
      if (!containers) break;
      const kept = containersKept(
        sourceLines[start + index - 1] ?? ``,
        containers.map((c) => c.line)
      );
      // A caption line at the same level or deeper continues the caption; one written outside more blocks starts the caption of the one it leaves.
      const previous = segments.at(-1);
      if (previous && kept >= previous.kept) continue;
      const target = containers[kept]?.target ?? para;
      if (captioned(target)) continue;
      segments.push({ index, kept, target });
    }
    if (segments.length === 0) continue;

    const head = lines.slice(0, segments[0]!.index);
    // A hard break ending the line before a caption ends the paragraph instead.
    const lastLine = head.at(-1);
    if (lastLine?.at(-1)?.type === `break`)
      head[head.length - 1] = lastLine.slice(0, -1);
    para.children = (linesToParagraph(head)?.children ??
      []) as unknown as Node[];
    const author = takeProperties(para);
    for (const [i, segment] of segments.entries()) {
      const caption = captionContent(
        lines.slice(segment.index, segments[i + 1]?.index)
      );
      // Attributes ending the paragraph end its last caption.
      const properties = i === segments.length - 1 ? author : undefined;
      const { target } = segment;
      if (target === para && onlyImages(para.children ?? []))
        replace(para, figure(para.children ?? [], caption, properties));
      else replace(target, figure([target], caption, properties));
    }
  }
};
