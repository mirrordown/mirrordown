// The rules behind task list items, shared by the markdown-it, remark and Sätteri plugins: which markers make a task, what each one says, and where a box ends. GFM reads `[ ]` and `[x]`; the community that writes Obsidian vaults agrees on six more (see the guide), and none of them means the task is done.

/** Options shared by the task-lists plugins for every engine. */
export interface TaskListsOptions {
  /**
   * A marker to its label, the box's accessible name. A string adds a marker or relabels a default, which is also how the labels are translated; `false` removes one, so that marker is text again. A key is one character, one UTF-16 code unit, other than whitespace, `]`, `x` and `X`.
   */
  markers?: Record<string, string | false>;
  /**
   * Read any single character (one UTF-16 code unit, other than `]` and a line ending) as a task, as Obsidian does. An unlisted marker then gets `data-task` and no label. Default `false`.
   */
  fallback?: boolean;
}

/** The six markers the community's themes agree on, each with its label. */
export const TASK_MARKERS: Readonly<Record<string, string>> = {
  "/": `In progress`,
  "-": `Cancelled`,
  ">": `Forwarded`,
  "<": `Scheduled`,
  "?": `Question`,
  "!": `Important`
};

/** What a task's box says. */
export interface TaskBox {
  /** Only "done" is checked. */
  checked: boolean;
  /** The marker as written, for `data-task`: absent for to-do and done, which are GFM's. */
  marker?: string;
  /** The box's accessible name, when the marker has one. */
  label?: string;
}

/** A box found at the start of a task item's text. */
export interface TaskBoxMatch extends TaskBox {
  /** How many characters of the text the box and the one whitespace character after it take. */
  length: number;
}

/** What follows the text a box is looked for in. */
export interface TaskBoxContext {
  /** Indices of the text's characters written as an escape or a character reference: such a character is never part of a box. */
  escaped?: ReadonlySet<number>;
  /** The paragraph goes on after the text: a hard line break, emphasis, a link. */
  more: boolean;
  /** The next node is a hard line break. */
  breakAfter: boolean;
  /**
   * The source right after the box's `]` (two characters are enough), or `undefined` when it cannot be told. The parsed text no longer shows what was written there, and GFM reads the box by it: a hard line break written with a backslash right after the box is not whitespace, so `[x]\` is text; and Sätteri reads `[x]` directly followed by CRLF as text, so every marker does (with whitespace between, the box is a task).
   */
  sourceAfter: string | undefined;
}

/** Reads a box's marker, under a plugin's options. */
export type TaskMarkerResolver = (marker: string) => TaskBox | undefined;

const WHITESPACE = /^\s$/u;

/**
 * Resolve markers the same way in every engine. Throws at plugin setup for a key of `options.markers` that cannot be a marker.
 */
export const createTaskResolver = (
  options: TaskListsOptions = {}
): TaskMarkerResolver => {
  const { markers = {}, fallback = false } = options;
  // Keys come from configuration and markers from the document: neither is looked up in a plain object, where `constructor` and `__proto__` are always found.
  const labels = new Map(Object.entries(TASK_MARKERS));
  const removed = new Set<string>();
  for (const [key, label] of Object.entries(markers)) {
    if (
      key.length !== 1 ||
      WHITESPACE.test(key) ||
      key === `]` ||
      key === `x` ||
      key === `X`
    ) {
      throw new TypeError(
        `task-lists: ${JSON.stringify(key)} cannot be a task marker. A marker is one character (one UTF-16 code unit) other than whitespace, "]", "x" and "X", which are GFM's.`
      );
    }
    if (label === false) {
      labels.delete(key);
      removed.add(key);
    } else if (typeof label === `string`) {
      labels.set(key, label);
      removed.delete(key);
    } else {
      throw new TypeError(
        `task-lists: the label for ${JSON.stringify(key)} must be a string, or false to remove the marker.`
      );
    }
  }
  return (marker) => {
    if (marker === ` ` || marker === `\t`) return { checked: false };
    if (marker === `x` || marker === `X`) return { checked: true };
    // A marker removed with `false` is text, `fallback` or not.
    if (removed.has(marker)) return undefined;
    const label = labels.get(marker);
    if (label !== undefined) {
      // An empty label names nothing, so the box gets none.
      return label === ``
        ? { checked: false, marker }
        : { checked: false, marker, label };
    }
    if (fallback && marker !== `]` && marker !== `\n` && marker !== `\r`) {
      return { checked: false, marker };
    }
    return undefined;
  };
};

/** A point in a document, as unist has it. */
export interface TaskPoint {
  line: number;
  column: number;
  offset?: number | undefined;
}

/**
 * Where a text node starts once a box is taken off its front: the first `length` characters of `value`, which began at `start` in `source`. A plugin that runs later reads the text's escapes from its position, so it must still line up with the source.
 */
export const startAfterBox = (
  start: TaskPoint,
  value: string,
  length: number,
  source: string
): TaskPoint => {
  if (start.offset === undefined) return start;
  const offset = start.offset + length;
  if (!/[\n\r]/.test(value.slice(0, length))) {
    return { line: start.line, column: start.column + length, offset };
  }
  const lineStart =
    Math.max(
      source.lastIndexOf(`\n`, offset - 1),
      source.lastIndexOf(`\r`, offset - 1)
    ) + 1;
  return { line: start.line + 1, column: offset - lineStart + 1, offset };
};

/**
 * Find a box at the start of `value`, the text a task item's first paragraph opens with (in markdown-it, its leading text tokens, with a soft line break after them as `\n`). As GFM has it: `[`, one marker, `]`, then one space, tab or line ending, and more of the paragraph after that; or the box alone before a hard line break. Returns `undefined` when there is no box.
 */
export const matchTaskBox = (
  value: string,
  context: TaskBoxContext,
  resolve: TaskMarkerResolver
): TaskBoxMatch | undefined => {
  const { escaped, more, breakAfter, sourceAfter } = context;
  if (!value.startsWith(`[`) || value.charAt(2) !== `]`) return undefined;
  for (let i = 0; i < 4; i++) if (escaped?.has(i)) return undefined;
  const box = resolve(value.charAt(1));
  if (!box) return undefined;
  const after = value.charAt(3);
  let length: number;
  if (after === ``) {
    // The box ends its text: a task only before a hard line break made of trailing whitespace, which stays.
    if (!breakAfter) return undefined;
    if (sourceAfter !== undefined && !/^[\t ]/.test(sourceAfter))
      return undefined;
    length = 3;
  } else if (after === ` ` || after === `\t`) {
    length = 4;
  } else if (after === `\n` || after === `\r`) {
    if ((sourceAfter ?? value.slice(3)).startsWith(`\r\n`)) return undefined;
    // A line ending is one whitespace character, CRLF included.
    length = after === `\r` && value.charAt(4) === `\n` ? 5 : 4;
  } else {
    return undefined;
  }
  return value.length > length || more ? { ...box, length } : undefined;
};
