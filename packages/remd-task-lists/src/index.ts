import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { ListItem, Root } from "mdast";
import type { Element, ElementContent } from "hast";
import { defaultHandlers, type Handler } from "mdast-util-to-hast";
import {
  TASK_MARKERS,
  createTaskResolver,
  matchTaskBox,
  startAfterBox,
  textEscapes,
  type TaskListsOptions
} from "@mirrordown/core";

export type { TaskListsOptions };
export { TASK_MARKERS };

// The label rides on the list item to the hast handler, which is where the box exists.
interface TaskData {
  taskListLabel?: string;
}

/**
 * remark plugin for task lists: GFM's `[ ]` and `[x]`, and the six markers the community agrees on (`[/]`, `[-]`, `[>]`, `[<]`, `[?]`, `[!]`). Every task is a list item with `checked`, as remark-gfm makes one, so plugins that know GFM's tasks know these: only "done" is `true`. An item GFM has already read is left alone. Pass `taskListsHastHandlers` to `remark-rehype` for the label on the box.
 */
export const remarkTaskLists: Plugin<[TaskListsOptions?], Root> = (
  options = {}
) => {
  const resolve = createTaskResolver(options);
  return (tree, file) => {
    // The source tells an escaped box (`\[x]`) from a real one.
    const source = String(file);
    visit(tree, `listItem`, (item: ListItem) => {
      if (typeof item.checked === `boolean`) return;
      const [paragraph] = item.children;
      if (paragraph?.type !== `paragraph`) return;
      // Sätteri reads a box only on the line the item starts on, so every engine does.
      const line = paragraph.position?.start.line;
      if (line !== undefined && line !== item.position?.start.line) return;
      const [head, next] = paragraph.children;
      if (head?.type !== `text`) return;
      const start = head.position?.start;
      const box = matchTaskBox(
        head.value,
        {
          escaped: textEscapes(head, source),
          more: next !== undefined,
          breakAfter: next?.type === `break`,
          crlfAfter:
            start?.offset === undefined
              ? head.value.startsWith(`\r\n`, 3)
              : source.startsWith(`\r\n`, start.offset + 3)
        },
        resolve
      );
      if (!box) return;

      const rest = head.value.slice(box.length);
      if (rest === ``) {
        paragraph.children.shift();
      } else {
        if (start && head.position && paragraph.position) {
          const after = startAfterBox(start, head.value, box.length, source);
          head.position = { ...head.position, start: after };
          paragraph.position = { ...paragraph.position, start: { ...after } };
        }
        head.value = rest;
      }
      item.checked = box.checked;
      if (box.marker === undefined) return;
      const data: TaskData = box.label ? { taskListLabel: box.label } : {};
      item.data = {
        ...item.data,
        ...data,
        // Under the attribute's own name, which attrs writes too: a `data-task` the author gives the item replaces this one rather than being a second.
        hProperties: { ...item.data?.hProperties, "data-task": box.marker }
      };
    });
  };
};

// The box mdast-util-to-hast puts first in a task item: in its paragraph when the list is loose.
const findBox = (item: Element): Element | undefined => {
  const first = item.children.find(
    (child): child is Element => child.type === `element`
  );
  const box =
    first?.tagName === `p`
      ? first.children.find(
          (child: ElementContent): child is Element => child.type === `element`
        )
      : first;
  return box?.tagName === `input` ? box : undefined;
};

/** mdast-to-hast handlers that label a task's box with what its marker says, for use with `remark-rehype`. */
export const taskListsHastHandlers: Record<string, Handler> = {
  listItem(state, node: ListItem, parent) {
    const result = defaultHandlers.listItem(state, node, parent);
    const data: unknown = node.data;
    const label =
      typeof data === `object` && data !== null && `taskListLabel` in data
        ? data.taskListLabel
        : undefined;
    if (typeof label !== `string`) return result;
    const box = findBox(result);
    if (box) box.properties[`ariaLabel`] = label;
    return result;
  }
};
