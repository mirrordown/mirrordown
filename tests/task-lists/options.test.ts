import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { taskLists } from "../../packages/mdit-task-lists/src";
import {
  remarkTaskLists,
  type TaskListsOptions
} from "../../packages/remd-task-lists/src";
import { satteriTaskLists } from "../../packages/sat-task-lists/src";
import { pipelines } from "./engines.js";

const list = (items: string): string =>
  `<ul class="contains-task-list">${items}</ul>`;
const item = (marker: string, label: string | undefined, text: string) =>
  `<li class="task-list-item" data-task="${marker}"><input type="checkbox" disabled${label === undefined ? "" : ` aria-label="${label}"`}> ${text}</li>`;

const cases: readonly (readonly [string, TaskListsOptions, string, string])[] =
  [
    [
      "a marker added with its label",
      { markers: { b: "Bookmark" } },
      "- [b] read later\n- [?] question",
      list(
        item("b", "Bookmark", "read later") + item("?", "Question", "question")
      )
    ],
    // The labels are the boxes' accessible names, so relabelling is also how they are translated.
    [
      "a default relabelled",
      { markers: { "?": "Frage", "!": "Wichtig" } },
      "- [?] a\n- [!] b\n- [/] c",
      list(
        item("?", "Frage", "a") +
          item("!", "Wichtig", "b") +
          item("/", "In progress", "c")
      )
    ],
    [
      "a default removed is text again",
      { markers: { "?": false } },
      "- [?] a\n- [!] b",
      `<ul class="contains-task-list"><li>[?] a</li>${item("!", "Important", "b")}</ul>`
    ],
    [
      "a label is escaped",
      { markers: { "?": 'Ask "why" & <how>' } },
      "- [?] a",
      // In an attribute value the engines leave `<` and `>` as they are or escape them, which the comparison evens out; a quote and an ampersand are escaped in every engine.
      list(item("?", "Ask &quot;why&quot; &amp; <how>", "a"))
    ],
    // An empty label names nothing, so the box gets no `aria-label` rather than an empty one.
    [
      "an empty label leaves the box unlabelled",
      { markers: { "?": "" } },
      "- [?] a",
      list(item("?", undefined, "a"))
    ],
    [
      "fallback: any character is a task, with no label",
      { fallback: true },
      "- [b] bookmark\n- [_] x\n- [1] one",
      list(
        item("b", undefined, "bookmark") +
          item("_", undefined, "x") +
          item("1", undefined, "one")
      )
    ],
    [
      "fallback: the defaults keep their labels",
      { fallback: true },
      "- [?] a\n- [x] b",
      list(
        item("?", "Question", "a") +
          '<li class="task-list-item"><input type="checkbox" checked disabled> b</li>'
      )
    ],
    [
      "fallback: a marker the document holds is never looked up as an object key",
      { fallback: true, markers: { b: "Bookmark" } },
      "- [_] x\n- [b] y",
      list(item("_", undefined, "x") + item("b", "Bookmark", "y"))
    ],
    [
      "fallback: a quote is a marker, escaped in the attribute",
      { fallback: true },
      '- ["] quoted',
      list(item("&quot;", undefined, "quoted"))
    ],
    // `]` closes the box, so it cannot be in it.
    [
      "fallback: `]` is not a marker",
      { fallback: true },
      "- []] a",
      "<ul><li>[]] a</li></ul>"
    ],
    // `false` is the more particular setting, so it wins over the blanket `fallback`.
    [
      "fallback: a default removed stays text",
      { fallback: true, markers: { "?": false } },
      "- [?] a",
      "<ul><li>[?] a</li></ul>"
    ],
    [
      "without fallback, an unlisted marker is text",
      { markers: { b: "Bookmark" } },
      "- [c] a",
      "<ul><li>[c] a</li></ul>"
    ]
  ];

describe.each(cases)(
  "task-lists options: %s",
  (_name, options, input, expected) => {
    it.each(pipelines(options))("%s", (_engine, render) => {
      expect(render(input)).toBe(expected);
    });
  }
);

// A key that cannot be a marker is a mistake in the configuration: each engine says so when the plugin is set up, not by rendering the document differently.
describe("task-lists options: a key that cannot be a marker throws", () => {
  const setups: readonly (readonly [
    string,
    (options: TaskListsOptions) => unknown
  ])[] = [
    ["markdown-it", (options) => new MarkdownIt().use(taskLists, options)],
    [
      "remark",
      (options) =>
        unified()
          .use(remarkParse)
          .use(remarkTaskLists, options)
          .runSync({ type: "root", children: [] })
    ],
    ["sätteri", (options) => satteriTaskLists(options)]
  ];

  it.each(setups)("%s", (_engine, setup) => {
    for (const key of [
      "",
      "ab",
      " ",
      "\t",
      "\n",
      " ",
      "]",
      "x",
      "X",
      // Two UTF-16 code units.
      "😀",
      // Members of every object, which a lookup in a plain object would find.
      "constructor",
      "__proto__"
    ]) {
      expect(() => setup({ markers: { [key]: "Label" } })).toThrow(
        /cannot be a task marker/
      );
    }
  });

  it.each(setups)(
    "%s: a label that is not a string or false",
    (_engine, setup) => {
      expect(() =>
        setup({ markers: { "?": true as unknown as string } })
      ).toThrow(/must be a string, or false/);
    }
  );
});

// A configuration object is often a shared constant: a plugin that wrote into it would change the next one built from it.
describe("task-lists options: the options object is left as it is", () => {
  it.each(
    pipelines(
      Object.freeze({
        fallback: true,
        markers: Object.freeze({ b: "Bookmark", "?": false as const })
      })
    )
  )("%s", (_engine, render) => {
    expect(render("- [b] a")).toBe(list(item("b", "Bookmark", "a")));
  });
});
