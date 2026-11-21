import { describe, expect, it } from "vite-plus/test";
import { comparable } from "../utils/hostile.js";
import { markdownIt, pipelines, remark, satteri } from "./engines.js";

const list = (items: string): string =>
  `<ul class="contains-task-list">${items}</ul>`;
const done = (text: string): string =>
  `<li class="task-list-item"><input type="checkbox" checked disabled>${text}</li>`;
const question = (text: string): string =>
  `<li class="task-list-item" data-task="?"><input type="checkbox" disabled aria-label="Question">${text}</li>`;

// Line endings cannot be written into a fixture file (the repository stores text with LF), so the cases that turn on them are here, for every pipeline. markdown-it writes every line ending in text as `\n` and the others keep a `\r` as written, which no plugin decides: `comparable` evens that out.
describe.each(pipelines())("task-lists: line endings (%s)", (_name, render) => {
  it.each([
    [
      "reads boxes in a CRLF document",
      "- [ ] a\r\n- [x] b\r\n- [?] c\r\n",
      list(
        `<li class="task-list-item"><input type="checkbox" disabled> a</li>${done(" b")}${question(" c")}`
      )
    ],
    ["keeps a CRLF inside the text", "- [?] a\r\n  b", list(question(" a\nb"))],
    [
      // Sätteri reads `[x]` directly followed by CRLF as text, so every marker is, in every engine.
      "reads a box directly followed by CRLF as text",
      "- [?]\r\n  text",
      "<ul><li>[?]\ntext</li></ul>"
    ],
    [
      "reads a box followed by a space and CRLF as a task",
      "- [?] \r\n  text",
      list(question(" text"))
    ],
    [
      "reads a box followed by a lone CR as a task",
      "- [?]\r  text",
      list(question(" text"))
    ],
    [
      "reads `[x]` followed by a lone CR as a task",
      "- [x]\r  text",
      list(done(" text"))
    ],
    [
      "keeps a hard break of trailing spaces after the box",
      "- [?]  \n  text",
      list(question(" <br>\ntext"))
    ],
    [
      "keeps a hard break of trailing spaces before CRLF",
      "- [?]  \r\n  text",
      list(question(" <br>\ntext"))
    ]
  ])("%s", (_case, input, expected) => {
    expect(comparable(render(input))).toBe(expected);
  });
});

// The edges where remark-gfm and Sätteri read `[x]` differently from each other. Neither is this set's to change, so each pipeline is pinned as it is; every other marker follows Sätteri in every engine (the `?` cases in the fixtures). With GFM off, the plugin reads `[x]` itself and follows Sätteri too.
describe("task-lists: where remark-gfm and Sätteri read `[x]` differently", () => {
  const plugin = [markdownIt(), remark(false), satteri(false)];
  const remarkGfm = remark(true);
  const satteriGfm = satteri(true);

  it("a box on the line after an empty list marker is a task only to remark-gfm", () => {
    const input = "-\n  [x] text";
    const text = "<ul><li>[x] text</li></ul>";
    for (const render of plugin) expect(render(input)).toBe(text);
    expect(satteriGfm(input)).toBe(text);
    expect(remarkGfm(input)).toBe(list(done(" text")));
  });

  it("a box directly followed by CRLF is a task only to remark-gfm, which keeps the LF", () => {
    const input = "- [x]\r\n  text";
    const text = "<ul><li>[x]\ntext</li></ul>";
    for (const render of plugin) expect(comparable(render(input))).toBe(text);
    expect(comparable(satteriGfm(input))).toBe(text);
    expect(remarkGfm(input)).toBe(list(done(" \ntext")));
  });

  it("whitespace and a line ending after the box: Sätteri's GFM keeps the next line's indent and drops a hard break", () => {
    for (const [input, expected] of [
      ["- [x] \n  text", done(" text")],
      ["- [x]\t\n  text", done(" text")],
      ["- [x]  \n  text", done(" <br>\ntext")]
    ] as const) {
      for (const render of [...plugin, remarkGfm])
        expect(render(input)).toBe(list(expected));
      expect(satteriGfm(input)).toBe(list(done("   text")));
    }
  });

  it("a space and CRLF after the box: remark-gfm keeps the LF, Sätteri's GFM the next line's indent", () => {
    const input = "- [x] \r\n  text";
    for (const render of plugin)
      expect(render(input)).toBe(list(done(" text")));
    expect(remarkGfm(input)).toBe(list(done(" \ntext")));
    expect(satteriGfm(input)).toBe(list(done("   text")));
  });

  // Not a paragraph, so not a task by rule (GFM's spec, remark-gfm); Sätteri's GFM reads the box before it sees the underline.
  it("a box opening a setext heading is a task only to Sätteri's GFM, outside the heading", () => {
    const input = "- [x] heading\n  ===";
    const heading = "<ul><li><h1>[x] heading</h1></li></ul>";
    for (const render of [...plugin, remarkGfm])
      expect(render(input)).toBe(heading);
    expect(satteriGfm(input)).toBe(
      list(
        '<li class="task-list-item"><input type="checkbox" checked disabled> <h1>heading</h1></li>'
      )
    );
  });

  // A line ending is not a marker, so with GFM off and for every other marker the box is text.
  it("a line ending inside the box is a to-do only to remark-gfm", () => {
    const input = "- [\n  ] text";
    const text = "<ul><li>[\n] text</li></ul>";
    for (const render of plugin) expect(render(input)).toBe(text);
    expect(satteriGfm(input)).toBe(text);
    expect(remarkGfm(input)).toBe(
      list(
        '<li class="task-list-item"><input type="checkbox" disabled> text</li>'
      )
    );
  });
});
