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

type TextVisitor = NonNullable<MdastPluginInstance["text"]>;

/**
 * The plugin's definition: only the keys it defines, with a synchronous visitor, so `markdownToHtml` returns its result directly.
 */
export interface TaskListsPlugin {
  name: string;
  options: { position: boolean };
  text: (...args: Parameters<TextVisitor>) => void;
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
  return ({ source }) => {
    // The lists given their class already: Sätteri hands every visitor of a pass the same parent object.
    const lists = new Set<object>();
    return defineMdastPlugin({
      name: `task-lists`,
      // Positions and the source tell an escaped box (`\[x]`) from a real one, and the line a box is on.
      options: { position: true },
      // A text visitor, not a list one: reading a list's items costs far more in Sätteri than reading a text, and almost every text is turned away by its first and third characters.
      text(head, ctx) {
        const { value } = head;
        if (!value.startsWith(`[`) || value.charAt(2) !== `]`) return;
        const paragraph = ctx.parent(head);
        if (paragraph.type !== `paragraph` || ctx.indexOf(head) !== 0) return;
        const item = ctx.parent(paragraph);
        if (
          item.type !== `listItem` ||
          // GFM has read it already.
          typeof item.checked === `boolean` ||
          ctx.indexOf(paragraph) !== 0 ||
          // Sätteri reads `[x]` only on the line the item starts on, so every marker is read there.
          paragraph.position?.start.line !== item.position?.start.line
        )
          return;
        const [, next, ...phrasing] = paragraph.children;
        const start = head.position?.start;
        const box = matchTaskBox(
          value,
          {
            escaped: textEscapes(head, source),
            more: next !== undefined,
            breakAfter: next?.type === `break`,
            sourceAfter:
              start?.offset === undefined
                ? undefined
                : source.slice(start.offset + 3, start.offset + 5)
          },
          resolve
        );
        if (!box) return;

        const rest = value.slice(box.length);
        const text =
          rest === ``
            ? []
            : [
                {
                  type: `text` as const,
                  value: rest,
                  ...(start
                    ? {
                        position: {
                          ...head.position,
                          start: startAfterBox(start, value, box.length, source)
                        }
                      }
                    : {})
                }
              ];
        const { classes, others } = written(item);
        if (box.marker === undefined) {
          // To-do and done are GFM's: Sätteri draws the box from `checked`, which only a new item can carry. Its class goes after a block's, as when GFM reads the box.
          const [, ...blocks] = item.children;
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
            children: [
              {
                ...paragraph,
                children: [...text, ...(next ? [next] : []), ...phrasing]
              },
              ...blocks
            ]
          });
        } else {
          // Sätteri cannot label the box it draws, so the other markers draw their own.
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
          ctx.replaceNode(head, [
            checkbox,
            { type: `text`, value: ` ` },
            ...text
          ]);
          ctx.setField(item, `data`, {
            ...item.data,
            // Under the attribute's own name, which Sätteri's attributes use too: a `data-task` the author gives the item replaces this one rather than being a second.
            hProperties: {
              className: withClass(classes, `task-list-item`),
              "data-task": box.marker,
              ...others
            }
          });
        }

        // Sätteri gives a list holding a task its class only for the tasks GFM read, and a block's classes on the list replace it.
        const list = ctx.parent(item);
        if (list.type !== `list` || lists.has(list)) return;
        lists.add(list);
        const listed = written(list);
        ctx.setField(list, `data`, {
          ...list.data,
          hProperties: {
            className: withClass(listed.classes, `contains-task-list`),
            ...listed.others
          }
        });
      }
    });
  };
};
