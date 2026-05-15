// Matches: %{1,6}+? label text  (prefix-plus form: %+ Label)
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
  const m = TAB_HEADER_RE.exec(line);
  if (!m) return null;
  return { depth: m[1]!.length, open: m[2] === "+", label: m[3]! };
};

export const stripContinuation = (line: string): string => line.replace(/^> ?/, "");

// djb2 hash — returns an unsigned 32-bit integer
const djb2 = (str: string): number => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h;
};

// Strip a trailing attrs block like {.class #id} from plain label text.
export const stripAttrs = (text: string): string => text.replace(/\s*\{[^}]*\}\s*$/, "").trimEnd();

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

// position-based: unique per block even when label sets match
export const blockId = (startLine: number, gId: string): string => {
  const key = `${startLine}:${gId}`;
  return "tabs-" + djb2(key).toString(16);
};
