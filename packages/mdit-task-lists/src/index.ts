import type { PluginWithOptions } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type StateCore from "markdown-it/lib/rules_core/state_core.mjs";
import {
  TASK_MARKERS,
  createTaskResolver,
  matchTaskBox,
  type TaskListsOptions
} from "@mirrordown/core";

export type { TaskListsOptions };
export { TASK_MARKERS };

// A document's lines as written, each with its line ending: markdown-it turns every line ending into `\n` and drops a hard break's backslash or spaces before a plugin sees the text, and GFM reads a box by them.
const LINE = /[^\n\r]*(?:\r\n|\r|\n|$)/g;
const linesOf = (source: string): string[] =>
  Array.from(source.matchAll(LINE), ([line]) => line);

const isListOpen = (token: Token): boolean =>
  token.type === `bullet_list_open` || token.type === `ordered_list_open`;
const isListClose = (token: Token): boolean =>
  token.type === `bullet_list_close` || token.type === `ordered_list_close`;

// `name` last among the token's classes, where remark and Sätteri put the class GFM gives a task and its list.
const classLast = (token: Token, name: string): void => {
  const classes = (token.attrGet(`class`) ?? ``)
    .split(` `)
    .filter((value) => value !== `` && value !== name);
  token.attrSet(`class`, [...classes, name].join(` `));
};

/**
 * markdown-it plugin for task lists: GFM's `[ ]` and `[x]`, rendered as remark-gfm and Sätteri render them, and the six markers the community agrees on (`[/]`, `[-]`, `[>]`, `[<]`, `[?]`, `[!]`), each with `data-task` on its item and a label on its box. Only "done" is checked.
 */
export const taskLists: PluginWithOptions<TaskListsOptions> = (
  md,
  options = {}
) => {
  const resolve = createTaskResolver(options);
  // Each document's source as it was written, before markdown-it normalises its line endings.
  const written = new WeakMap<StateCore, string>();
  const lines = new WeakMap<StateCore, string[]>();
  // What follows a box that ends its line, read from the line as written: split once per document, and only when a box ends its line.
  const afterBox = (state: StateCore, line: number): string => {
    let all = lines.get(state);
    if (!all) {
      all = linesOf(written.get(state) ?? state.src);
      lines.set(state, all);
    }
    const text = all[line] ?? ``;
    // The box is all the line holds but whitespace, a backslash and the line ending, none of them a `]`.
    const close = text.lastIndexOf(`]`);
    return text.slice(close + 1, close + 3);
  };

  // The items and lists this plugin made tasks of, with the class each one got.
  const classed = new WeakMap<StateCore, Array<[Token, string]>>();

  md.core.ruler.before(`normalize`, `task_lists_source`, (state) => {
    written.set(state, state.src);
  });

  // Right after inline parsing, while an escaped or referenced character is still a token of its own (`text_special`), and before attrs and abbr read the item's text.
  md.core.ruler.after(`inline`, `task_lists`, (state) => {
    const { tokens } = state;
    const lists: Token[] = [];
    for (const [index, token] of tokens.entries()) {
      if (isListOpen(token)) lists.push(token);
      else if (isListClose(token)) lists.pop();
      if (token.type !== `list_item_open`) continue;
      const paragraph = tokens[index + 1];
      const inline = tokens[index + 2];
      const children = inline?.children;
      if (
        paragraph?.type !== `paragraph_open` ||
        inline?.type !== `inline` ||
        !children
      )
        continue;
      // Sätteri reads a box only on the line the item starts on, so every engine does.
      const line = paragraph.map?.[0];
      if (line === undefined || line !== token.map?.[0]) continue;

      // The item's leading text: a delimiter markdown-it did not pair (`*`) is a text token of its own.
      let lead = ``;
      let count = 0;
      for (const child of children) {
        if (child.type !== `text` || lead.length >= 5) break;
        lead += child.content;
        count++;
      }
      const next = children[count];
      const soft = next?.type === `softbreak`;
      // The box is all its line holds. markdown-it keeps a tab before a soft line break, which the other engines drop with the spaces there: the box is then followed by the line ending, as it is in theirs.
      const alone =
        (soft && /^\[[\s\S]\][\t ]*$/.test(lead)) ||
        (lead.length === 3 && next?.type === `hardbreak`);
      const box = matchTaskBox(
        soft ? `${lead.slice(0, alone ? 3 : undefined)}\n` : lead,
        {
          more: count < children.length,
          breakAfter: next?.type === `hardbreak`,
          sourceAfter: alone ? afterBox(state, line) : undefined
        },
        resolve
      );
      if (!box) continue;

      // Take the box and the whitespace after it off the leading text, and the soft line break when that is the whitespace.
      let remove = alone && soft ? lead.length + 1 : box.length;
      const kept: Token[] = [];
      for (const child of children) {
        if (remove > 0 && child.type === `text`) {
          const taken = Math.min(remove, child.content.length);
          child.content = child.content.slice(taken);
          remove -= taken;
          if (child.content !== ``) kept.push(child);
        } else if (remove > 0 && child.type === `softbreak`) {
          remove = 0;
        } else {
          kept.push(child);
        }
      }
      // The box as remark-gfm and Sätteri write it, which markdown-it's renderer would not (it writes `disabled=""`).
      const checkbox = new state.Token(`task_list_item_checkbox`, `input`, 0);
      checkbox.content = `<input type="checkbox"${box.checked ? ` checked` : ``} disabled${box.label ? ` aria-label="${md.utils.escapeHtml(box.label)}"` : ``}>`;
      const space = new state.Token(`text`, ``, 0);
      space.content = ` `;
      inline.children = [checkbox, space, ...kept];

      // The class first, then `data-task`, then what attrs adds, as the other engines order them.
      const done = classed.get(state) ?? [];
      classed.set(state, done);
      classLast(token, `task-list-item`);
      done.push([token, `task-list-item`]);
      if (box.marker !== undefined) token.attrSet(`data-task`, box.marker);
      const list = lists.at(-1);
      if (list) {
        classLast(list, `contains-task-list`);
        done.push([list, `contains-task-list`]);
      }
    }
  });

  // attrs adds its classes after this plugin has run (it runs right before `linkify`, wherever it is added): put the task's class back after them.
  md.core.ruler.after(`linkify`, `task_lists_classes`, (state) => {
    for (const [token, name] of classed.get(state) ?? [])
      classLast(token, name);
  });

  md.renderer.rules[`task_list_item_checkbox`] = (tokens, idx): string =>
    tokens[idx]?.content ?? ``;
};
