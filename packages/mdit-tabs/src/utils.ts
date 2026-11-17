import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import type Token from "markdown-it/lib/token.mjs";

// Matches: %{1,6}+? label text
// Groups: 1=% string (depth), 2=+ (open marker, optional), 3=label text
export const TAB_HEADER_RE = /^(%{1,6})(\+)? (.*)/;

// Matches: > or ><space> continuation line
export const CONTINUATION_RE = /^> ?/;

export interface ParsedTabHeader {
  depth: number;
  open: boolean;
  label: string;
}

export const parseTabHeader = (line: string): ParsedTabHeader | null => {
  // Spaces at the end of the line are not part of the header (two or more would be a hard break in a paragraph; a header is one line), so a marker followed only by spaces isn't one, as in the other engines, which never see them.
  const m = TAB_HEADER_RE.exec(line.trimEnd());
  if (!m) return null;
  return { depth: m[1].length, open: m[2] === "+", label: m[3] };
};

// The marker takes one column of a tab after it, as it takes a space; the tab's other two columns stay as indentation, so the line isn't read as indented code.
export const stripContinuation = (line: string): string =>
  line.startsWith(">\t")
    ? `  ${line.slice(2)}`
    : line.replace(CONTINUATION_RE, "");

// The paragraph that starts at `startLine`, as markdown-it's paragraph rule reads one. For a line CommonMark continues the header's paragraph with (a `>` indented four columns or more), which ends the group: left to the block rules, a line indented that far after it would be indented code.
export const lazyParagraph = (
  state: StateBlock,
  startLine: number,
  endLine: number
): void => {
  const terminators = state.md.block.ruler.getRules("paragraph");
  const parentType = state.parentType;
  state.parentType = "paragraph";
  let nextLine = startLine + 1;
  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    // An indented line, or one a list item's negative indent marks, continues the paragraph.
    const indent = state.sCount[nextLine] - state.blkIndent;
    if (indent > 3 || state.sCount[nextLine] < 0) continue;
    const line = nextLine;
    if (terminators.some((rule) => rule(state, line, endLine, true))) break;
  }
  const content = state
    .getLines(startLine, nextLine, state.blkIndent, false)
    .trim();
  state.line = nextLine;
  const open = state.push("paragraph_open", "p", 1);
  open.map = [startLine, nextLine];
  const inline = state.push("inline", "", 0);
  inline.content = content;
  inline.map = [startLine, nextLine];
  inline.children = [];
  state.push("paragraph_close", "p", -1);
  state.parentType = parentType;
};

// Whether a paragraph is open at the end of the lines read for an item so far, for a line CommonMark would continue it with: the header's own when the item has no body yet, else the last block of the body, through the lists and quotes it is nested in. The body's last run of lines is tokenized to tell (only when such a line is met).
export const paragraphOpen = (
  state: StateBlock,
  bodyLines: ReadonlyArray<string | null>
): boolean => {
  if (bodyLines.length === 0) return true;
  if (!bodyLines.at(-1)?.trim()) return false;
  const run = bodyLines.slice(bodyLines.lastIndexOf(null) + 1).join("\n");
  const tokens: Token[] = [];
  state.md.block.parse(run, state.md, {}, tokens);
  let last = tokens.length - 1;
  while (
    last >= 0 &&
    tokens[last].nesting === -1 &&
    tokens[last].type !== "paragraph_close"
  )
    last--;
  return tokens[last]?.type === "paragraph_close";
};

// Whether a line that is neither a header nor a `>` line is one CommonMark lazily continues a paragraph with: written short of the content of the list item the group is in, and no block that interrupts a paragraph.
export const isLazyLine = (
  state: StateBlock,
  line: number,
  endLine: number
): boolean => {
  // A line written without a blockquote's marker (markdown-it marks it with a negative indent) is not one: it leaves the blockquote, which the other engines' recognition reproduces.
  if (state.isEmpty(line) || state.sCount[line] < 0) return false;
  if (state.sCount[line] >= state.blkIndent) return false;
  return !state.md.block.ruler
    .getRules("paragraph")
    .some((rule) => rule(state, line, endLine, true));
};

// djb2 hash — returns an unsigned 32-bit integer
const djb2 = (str: string): number => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h;
};

// Strip a trailing attrs block like {.class #id} from plain label text.
// Tabs strips this before setting aria-label so attrs-consumed markers don't leak.
export const stripAttrs = (text: string): string =>
  text.replace(/\s*\{[^}]*\}\s*$/, "").trimEnd();

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");

// content-based: same label set → same id regardless of page position
export const groupId = (labels: string[]): string => {
  const key = [...labels].map(slugify).sort().join("-");
  return djb2(key).toString(16);
};

// A group's block id: its group id with the group's index among the document's tab groups, counted in the order they open, as the remark and Sätteri plugins count them.
export const blockId = (index: number, gId: string): string => {
  const key = `${index}:${gId}`;
  return "tabs-" + djb2(key).toString(16);
};
