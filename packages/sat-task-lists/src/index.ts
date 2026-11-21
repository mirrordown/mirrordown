import {
  TASK_MARKERS,
  createTaskResolver,
  matchTaskBox,
  startAfterBox,
  textEscapes,
  type TaskListsOptions
} from "@mirrordown/core";
import {
  defineMdastPlugin,
  type Custom,
  type MdastPluginInstance,
  type PluginFactoryContext
} from "satteri";

export type { TaskListsOptions };
export { TASK_MARKERS };

type ListVisitor = NonNullable<MdastPluginInstance["list"]>;

/**
 * The plugin's definition: only the keys it defines, with a synchronous visitor, so `markdownToHtml` returns its result directly.
 */
export interface TaskListsPlugin {
  name: string;
  options: { position: boolean };
  list: (...args: Parameters<ListVisitor>) => void;
}

type Properties = Record<string, unknown>;

// The properties a parser feature (attributes) has left on a node, and its classes apart from them.
const written = (node: {
  data?: unknown;
}): { classes: unknown[]; others: Properties } => {
  const { data } = node;
  const properties: Properties =
    typeof data === `object` &&
    data !== null &&
    `hProperties` in data &&
    typeof data.hProperties === `object` &&
    data.hProperties !== null
      ? { ...data.hProperties }
      : {};
  const { className, ...others } = properties;
  return { classes: Array.isArray(className) ? className : [], others };
};

// A class that ends the list GFM's own would: Sätteri puts a block's classes before the class it gives a task, and replaces its class with theirs when they were read first.
const withClass = (classes: readonly unknown[], name: string): unknown[] =>
  classes.includes(name) ? [...classes] : [...classes, name];

/**
 * Sätteri plugin for task lists: GFM's `[ ]` and `[x]`, and the six markers the community agrees on (`[/]`, `[-]`, `[>]`, `[<]`, `[?]`, `[!]`). To-do and done become list items with `checked`, which Sätteri renders as GFM does; the other markers render their own box through `hName`, as Sätteri cannot label the one it draws. An item GFM has already read is left alone.
 */
export const satteriTaskLists = (
  options: TaskListsOptions = {}
): ((ctx: PluginFactoryContext) => TaskListsPlugin) => {
  // Resolved here, so an invalid marker throws when the plugin is set up.
  const resolve = createTaskResolver(options);
  return ({ source }) =>
    defineMdastPlugin({
      name: `task-lists`,
      // Positions and the source tell an escaped box (`\[x]`) from a real one, and the line a box is on.
      options: { position: true },
      list(list, ctx) {
        // Whether this plugin made a task of an item: a list whose tasks are all GFM's is left as GFM rendered it.
        let tasks = false;
        for (const item of list.children) {
          if (typeof item.checked === `boolean`) continue;
          const [paragraph, ...blocks] = item.children;
          if (paragraph?.type !== `paragraph`) continue;
          // Sätteri reads `[x]` only on the line the item starts on, so every marker is read there.
          if (paragraph.position?.start.line !== item.position?.start.line)
            continue;
          const [head, next, ...phrasing] = paragraph.children;
          if (head?.type !== `text`) continue;
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
          if (!box) continue;
          tasks = true;

          const value = head.value.slice(box.length);
          const text =
            value === ``
              ? []
              : [
                  {
                    type: `text` as const,
                    value,
                    ...(start && head.position
                      ? {
                          position: {
                            ...head.position,
                            start: startAfterBox(
                              start,
                              head.value,
                              box.length,
                              source
                            )
                          }
                        }
                      : {})
                  }
                ];
          const after = [...text, ...(next ? [next] : []), ...phrasing];
          const { classes, others } = written(item);
          if (box.marker === undefined) {
            // To-do and done are GFM's: Sätteri draws the box from `checked`. Its class goes after a block's, as when GFM reads the box.
            ctx.replaceNode(item, {
              ...item,
              checked: box.checked,
              ...(classes.length > 0
                ? {
                    data: {
                      ...item.data,
                      hProperties: {
                        className: withClass(classes, `task-list-item`),
                        ...others
                      }
                    }
                  }
                : {}),
              children: [{ ...paragraph, children: after }, ...blocks]
            });
            continue;
          }
          const checkbox: Custom = {
            type: `taskListCheckbox`,
            data: {
              hName: `input`,
              hProperties: {
                type: `checkbox`,
                disabled: true,
                ...(box.label ? { ariaLabel: box.label } : {})
              }
            }
          };
          // A paragraph and an item holding a node of this plugin's own, which mdast's types do not allow in them.
          const boxed: Custom = {
            type: `paragraph`,
            ...(paragraph.position ? { position: paragraph.position } : {}),
            ...(paragraph.data ? { data: paragraph.data } : {}),
            children: [checkbox, { type: `text`, value: ` ` }, ...after]
          };
          const { position, ...fields } = item;
          ctx.replaceNode(item, {
            ...fields,
            ...(position ? { position } : {}),
            data: {
              ...item.data,
              // Under the attribute's own name, which Sätteri's attributes use too: a `data-task` the author gives the item replaces this one rather than being a second.
              hProperties: {
                className: withClass(classes, `task-list-item`),
                "data-task": box.marker,
                ...others
              }
            },
            children: [boxed, ...blocks]
          });
        }
        if (!tasks) return;
        // Sätteri gives a list holding a task its class only for the tasks GFM read, and a block's classes on the list replace it.
        const { classes, others } = written(list);
        ctx.setField(list, `data`, {
          ...list.data,
          hProperties: {
            className: withClass(classes, `contains-task-list`),
            ...others
          }
        });
      }
    });
};
