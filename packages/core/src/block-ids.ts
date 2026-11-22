// Block identifiers (`^id` at the end of a block), shared by the markdown-it, remark and Sätteri plugins. A marker is read from what a parser holds after inline parsing: the last text of a paragraph, a heading or an alert's title, so one inside emphasis, a link or a code span is text, and one written with an escape or a character reference is too. The marker and the whitespace before it are removed, and the block it names gets the `id` `^id`: the block itself, the list item it ends, the outermost quote or alert around it, or, when it stands alone in its own paragraph, the block before that paragraph. `processBlockIds` does this for an mdast tree (remark, and Sätteri through `editableTree`); markdown-it shares the marker, source and identifier rules.
// Recognition walks mdast and the custom nodes other plugins build (alerts, tab panels, steps) through one loose node shape; the assertions bridging it and mdast's types are reviewed and intentional.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import type { Root } from "mdast";
import type { Properties } from "hast";
import { carryEscapes, textEscapes } from "./escapes.js";
import {
  createAlertResolver,
  isAlertMarkerLine,
  plainText
} from "./github-alerts/index.js";
import { splitSourceLines } from "./lazy.js";

// `A`–`Z`, `a`–`z`, `0`–`9` and `-`: Obsidian's identifier characters. `_` is not one.
const isIdChar = (code: number): boolean =>
  (code >= 48 && code <= 57) ||
  (code >= 65 && code <= 90) ||
  (code >= 97 && code <= 122) ||
  code === 45;

const isBlank = (char: string): boolean => char === ` ` || char === `\t`;

/** A block identifier marker at the end of a text: the identifier, and the index of its `^`. */
export interface BlockMarker {
  id: string;
  start: number;
}

/**
 * The marker ending `value`, if it ends with `^` and one or more identifier characters (`A`–`Z`, `a`–`z`, `0`–`9`, `-`), with a space, a tab or a line ending before the `^`. A `^` at the very start of `value` counts when `separated` says what comes before the text ends a line or a word (a hard break, the start of the block, text ending in a space). Read from the end, so a long text costs no more than its last word.
 */
export const trailingMarker = (
  value: string,
  separated: boolean
): BlockMarker | undefined => {
  let i = value.length;
  while (i > 0 && isIdChar(value.charCodeAt(i - 1))) i--;
  if (i === value.length || i === 0 || value.charAt(i - 1) !== `^`)
    return undefined;
  const start = i - 1;
  const before = value.charAt(start - 1);
  const apart =
    start === 0
      ? separated
      : isBlank(before) || before === `\n` || before === `\r`;
  return apart ? { id: value.slice(i), start } : undefined;
};

/** `value` without its spaces and tabs at the end. A scan, not a pattern: `/[ \t]+$/` restarts on every character of a long run of spaces. */
export const trimBlankEnd = (value: string): string => {
  let end = value.length;
  while (end > 0 && isBlank(value.charAt(end - 1))) end--;
  return value.slice(0, end);
};

/**
 * What is left of `value` once the marker starting at `start` is cut, with the spaces and tabs before it and, where the marker stood alone on its line, the line ending before it and the spaces before that.
 */
export const cutMarker = (value: string, start: number): string => {
  let kept = trimBlankEnd(value.slice(0, start));
  if (kept.endsWith(`\n`)) kept = kept.slice(0, -1);
  if (kept.endsWith(`\r`)) kept = kept.slice(0, -1);
  return trimBlankEnd(kept);
};

/**
 * Whether source line `line` shows the marker `^id` with only spaces or tabs after it: `text ^blk ` is text, as in Obsidian. A line with something else after the marker (an attribute block attrs took off the block, a heading's closing `#`s) or without the marker at its end says nothing against it.
 */
export const blankAfterMarker = (
  line: string | undefined,
  id: string
): boolean => {
  if (line === undefined) return false;
  const trimmed = trimBlankEnd(line);
  return trimmed.length < line.length && trimmed.endsWith(`^${id}`);
};

/**
 * Whether an alert's first source line `line` ends its title with the marker `^id` as written text: a space or a tab before the `^`, nothing but the marker after it. An alert's title has lost what was before it (`[!NOTE]`, then the space) to the alert, so its text can't tell `> [!NOTE] ^id` from `> [!NOTE]^id`; its line can. A line that doesn't end in the marker (an attribute block was taken off the title) says nothing against it.
 */
export const titleMarkerWritten = (
  line: string | undefined,
  id: string
): boolean => {
  if (line === undefined) return true;
  const marker = `^${id}`;
  const trimmed = trimBlankEnd(line);
  if (!trimmed.endsWith(marker)) return true;
  return (
    trimmed.length === line.length &&
    isBlank(trimmed.charAt(trimmed.length - marker.length - 1))
  );
};

/**
 * Which element keeps which identifier, from the markers' namings in document order: an element named twice takes the last marker's identifier, and an identifier given to two elements stays with the one named last, as Obsidian resolves a duplicate. The others get no id.
 */
export const resolveBlockIds = <E>(
  namings: ReadonlyArray<{ element: E; id: string }>
): Map<E, string> => {
  const last = new Map<E, { id: string; order: number }>();
  for (const [order, { element, id }] of namings.entries())
    last.set(element, { id, order });
  const holders = new Map<string, { element: E; order: number }>();
  for (const [element, { id, order }] of last) {
    const holder = holders.get(id);
    if (!holder || holder.order < order) holders.set(id, { element, order });
  }
  const ids = new Map<E, string>();
  for (const [id, { element }] of holders) ids.set(element, id);
  return ids;
};

interface Point {
  line: number;
  column?: number | undefined;
  offset?: number | undefined;
}
interface Node {
  type: string;
  value?: string;
  children?: Node[];
  position?: { start: Point; end: Point } | undefined;
  data?: ({ hProperties?: Properties } & Record<string, unknown>) | undefined;
}

// Blocks whose last text a marker can end.
const READ = new Set([`paragraph`, `heading`, `alertTitle`]);
// A blockquote, or an alert: remark's alert is still a `blockquote`, Sätteri's an `alert`.
const QUOTES = new Set([`blockquote`, `alert`]);
// Containers whose content a marker inside doesn't leave: a tab panel and a step (remark builds `tabsItem` and `stepsItem`, Sätteri renders `tabsPanel` and `stepsBody`), and a footnote's definition, which renders at the end of the page. A quote around one isn't named from inside it.
const BOUNDARIES = new Set([
  `tabsItem`,
  `tabsPanel`,
  `stepsItem`,
  `stepsBody`,
  `footnoteDefinition`
]);
// Blocks whose paragraphs name them: a list item, and a definition's description (`<dd>`), whose paragraph a tight list doesn't render either.
const ITEMS = new Set([`listItem`, `defListDescription`, `descriptionDetails`]);
// Nodes that render nothing where they stand (markdown-it has no tokens for them): a marker in its own paragraph after one names the block before it.
const UNSEEN = new Set([`definition`, `footnoteDefinition`, `yaml`, `toml`]);
// Nodes a marker in its own paragraph after them can't name: raw HTML has no element to carry an id, and a container's title or label isn't a block of its own.
const NAMELESS = new Set([
  `html`,
  `alertTitle`,
  `stepsTitle`,
  `tabsLabel`,
  `tabsLabels`,
  `tabsInput`
]);

const ownProperties = (node: Node): Properties | undefined =>
  node.data?.hProperties;

// An id the author wrote (with attrs, or Sätteri's attribute blocks) is the block's: a marker that names it is only removed.
const authorId = (node: Node): boolean => {
  const id: unknown = ownProperties(node)?.id;
  return id !== undefined && id !== null && id !== ``;
};

// The alert's type, as remark (`data.alertType`) and Sätteri (`data-alert`) record it.
const alertTypeOf = (quote: Node | undefined): string | undefined => {
  const recorded = quote?.data?.alertType;
  if (typeof recorded === `string`) return recorded;
  const property = ownProperties(quote ?? { type: `` })?.dataAlert;
  return typeof property === `string` ? property : undefined;
};

// Line endings in `value` before `end`, counted as CommonMark counts them.
const lineEndings = (value: string, end: number): number => {
  let count = 0;
  for (let i = 0; i < end; i++) {
    const char = value.charAt(i);
    if (char === `\n` || (char === `\r` && value.charAt(i + 1) !== `\n`))
      count++;
  }
  return count;
};

/** How the tree's nodes are changed: in place by default (remark), or through the engine's own calls where its nodes are read-only (Sätteri's `ctx.setProperty`). Nothing reads a node again after changing it. */
export interface BlockIdEdits {
  setChildren: (node: unknown, children: unknown[]) => void;
  setData: (node: unknown, data: Record<string, unknown>) => void;
}

const inPlace: BlockIdEdits = {
  setChildren: (node, children) => {
    (node as Node).children = children as Node[];
  },
  setData: (node, data) => {
    (node as Node).data = data;
  }
};

/**
 * Turn each block identifier marker in an mdast tree into its block's `id` (`data.hProperties.id`), removing the marker, the whitespace before it and a paragraph left empty. `source` is the document the tree was parsed from: it tells a marker with only spaces after it on its line, and an escaped `^`, from a real one, so a tree without it (`runSync(tree)`) gets no ids. Run it after the plugins that build tab panels and steps from quotes, and after attrs, whose attribute blocks end a block before a marker does. The tree is walked with a stack, not recursion, so quotes can nest as deep as the parser takes them.
 */
export const processBlockIds = (
  root: Root,
  source: string,
  { setChildren, setData }: BlockIdEdits = inPlace
): void => {
  if (!source.includes(`^`)) return;
  const lines = splitSourceLines(source);

  // The tree's blocks in document order, each node's parent and its index there.
  const parents = new Map<Node, Node>();
  const indices = new Map<Node, number>();
  const blocks: Node[] = [];
  const stack: Node[] = [root as unknown as Node];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (READ.has(node.type)) {
      blocks.push(node);
      continue;
    }
    const children = node.children ?? [];
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i]!;
      parents.set(child, node);
      indices.set(child, i);
      stack.push(child);
    }
  }

  // Paragraphs a marker emptied, each with what a marker after it in its own paragraph names in its place.
  const removed = new Map<Node, Node | undefined>();
  const namings: Array<{ element: Node; id: string }> = [];

  // The block before `node` among its siblings that a marker in its own paragraph names, if any.
  const previousBlock = (node: Node): Node | undefined => {
    const siblings = parents.get(node)?.children ?? [];
    for (let i = (indices.get(node) ?? 0) - 1; i >= 0; i--) {
      const sibling = siblings[i]!;
      if (removed.has(sibling)) return removed.get(sibling);
      if (UNSEEN.has(sibling.type)) continue;
      return NAMELESS.has(sibling.type) ? undefined : sibling;
    }
    return undefined;
  };

  // The outermost quote or alert around `node`, up to the tab panel or step it is in.
  const outerQuote = (node: Node): Node | undefined => {
    let quote: Node | undefined;
    for (
      let parent = parents.get(node);
      parent && !BOUNDARIES.has(parent.type);
      parent = parents.get(parent)
    )
      if (QUOTES.has(parent.type)) quote = parent;
    return quote;
  };

  for (const block of blocks) {
    const children = block.children ?? [];
    const index = children.length - 1;
    const last = children[index];
    if (last?.type !== `text` || typeof last.value !== `string`) continue;
    const value = last.value;
    const previous = children[index - 1];
    const title = block.type === `alertTitle`;
    // What comes before the text ends a line or a word: the start of the block (an alert's title starts after its `[!TYPE]`, and an icon), a hard break, or text ending in a space or tab.
    const separated =
      previous === undefined ||
      previous.type === `break` ||
      (title && children.slice(0, index).every((c) => c.type === `html`)) ||
      (previous.type === `text` &&
        typeof previous.value === `string` &&
        isBlank(previous.value.charAt(previous.value.length - 1)));
    const marker = trailingMarker(value, separated);
    if (!marker) continue;
    const { id, start } = marker;

    // Written as plain text: no character of the marker is escaped or a character reference.
    const escaped = textEscapes(last, source);
    let literal = true;
    for (let i = start; i < value.length && literal; i++)
      literal = !escaped.has(i);
    if (!literal) continue;

    const parent = parents.get(block);
    if (title) {
      // An alert's title is its first line. It ends with the marker only when nothing followed on the lines of its paragraph, whose rest is then the alert's body. That body keeps the paragraph's position, which starts on the title's line; Sätteri's alert keeps no position of its own, so there the body is told by its first line being the alert's marker line. A body without a position continued the title if the line after the title isn't blank, since nothing but a paragraph's own lines puts a paragraph right after it.
      const line = parent?.position?.start.line;
      const next = parent?.children?.[(indices.get(block) ?? 0) + 1];
      if (next?.type === `paragraph`) {
        const body = next.position?.start.line;
        const continued =
          body === undefined
            ? line !== undefined &&
              (lines[line] ?? ``).replace(/^[ \t>]*/, ``) !== ``
            : line === undefined
              ? isAlertMarkerLine(lines[body - 1] ?? ``)
              : body === line;
        if (continued) continue;
      }
      // Without the alert's line (Sätteri, after github-alerts), what came before the title's text is unknown.
      if (line !== undefined && !titleMarkerWritten(lines[line - 1], id))
        continue;
    } else {
      // The marker's line, from where its text starts and from where the block ends: each is right where the other can be off (the text may be a plugin's, without a position; an attribute block on its own line may have been taken off the block's end).
      const written = [
        last.position
          ? last.position.start.line + lineEndings(value, start)
          : undefined,
        block.position?.end.line
      ];
      if (
        written.some(
          (line) => line !== undefined && blankAfterMarker(lines[line - 1], id)
        )
      )
        continue;
    }

    // Cut the marker, and a hard break it stood after alone on its line, with the spaces left before them.
    const kept = cutMarker(value, start);
    const content = children.slice(0, index);
    if (kept !== ``) {
      const text: Node = { ...last, value: kept };
      carryEscapes(text, escaped, 0);
      content.push(text);
    } else if (start === 0 && previous?.type === `break`) content.pop();
    for (
      let tail = content.at(-1);
      tail?.type === `text`;
      tail = content.at(-1)
    ) {
      const trimmed = trimBlankEnd(tail.value ?? ``);
      if (trimmed === tail.value) break;
      if (trimmed === ``) content.pop();
      else content[content.length - 1] = { ...tail, value: trimmed };
    }

    if (title) {
      // A title left empty is the type's own, as the alert gives a title with no text; its label is its text now.
      const visible = content.filter((child) => child.type !== `html`);
      if (visible.length === 0) {
        const type = alertTypeOf(parent);
        if (type !== undefined)
          content.push({
            type: `text`,
            value: createAlertResolver().titleFor(type)
          });
      }
      // Sätteri names the label `ariaLabel`, remark `aria-label`.
      const properties = ownProperties(block);
      const label = plainText(content).trim();
      const key =
        properties && `ariaLabel` in properties
          ? `ariaLabel`
          : properties && `aria-label` in properties
            ? `aria-label`
            : undefined;
      if (key)
        setData(block, {
          ...block.data,
          hProperties: { ...properties, [key]: label }
        });
    }

    const alone = block.type === `paragraph` && content.length === 0;
    if (!alone) setChildren(block, content);
    const quote = outerQuote(block);
    let target: Node | undefined;
    if (quote) target = quote;
    else if (block.type === `paragraph` && parent && ITEMS.has(parent.type))
      target = parent;
    else if (!alone) target = block;
    else target = previousBlock(block);
    if (alone) removed.set(block, target);
    // The id holds the `^`: it is the fragment Obsidian writes, and no heading's slug has one.
    if (target && !authorId(target))
      namings.push({ element: target, id: `^${id}` });
  }

  for (const [element, id] of resolveBlockIds(namings))
    setData(element, {
      ...element.data,
      hProperties: { ...ownProperties(element), id }
    });
  // Each parent's children are filtered once, however many of its paragraphs went.
  const emptied = new Set<Node>();
  for (const paragraph of removed.keys()) {
    const parent = parents.get(paragraph);
    if (parent) emptied.add(parent);
  }
  for (const parent of emptied)
    setChildren(
      parent,
      (parent.children ?? []).filter((child) => !removed.has(child))
    );
};
