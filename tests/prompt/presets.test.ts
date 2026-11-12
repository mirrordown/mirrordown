import { describe, expect, it } from "vite-plus/test";
import { engines } from "../presets/engines.js";

// The same heading, tabs and code block three times: on the page, in a prompt's preview, and on the page again. The page and the prompt each define a link, and each tries the other's.
const block = [
  "# Task",
  "",
  "The [page] and the [own].",
  "",
  "% One",
  "> a",
  "% Two",
  "> b",
  "",
  "```js",
  "code",
  "```"
];
const input = [
  "[page]: https://page.example",
  "",
  ...block,
  "",
  "````prompt open",
  "[own]: https://prompt.example",
  "",
  ...block,
  "````",
  "",
  ...block
].join("\n");

const attributes = (html: string, names: string): string[] =>
  [...html.matchAll(new RegExp(` (?:${names})="[^"]*"`, `g`))].map((match) =>
    match[0].trim()
  );

describe("prompt/presets", () => {
  const [[, markdownIt], ...others] = engines;
  const html = markdownIt()(input);

  // A preview is rendered as part of the page, so the ids its headings, tabs and code blocks take are counted with the page's: a second "Task" is `task-1` wherever it is, and no radio group or copy button of a preview shares an id with the page's. In markdown-it that counting lives on the render environment the preview's parse shares with the page; only the link definitions on it are the preview's own.
  it("counts a preview's heading, tabs and code block ids with the page's", () => {
    expect(attributes(html, `id|name`)).toEqual([
      'id="task"',
      'name="tabs-6cc665b1"',
      'id="tabs-6cc665b1-0"',
      'name="tabs-6cc665b1"',
      'id="tabs-6cc665b1-1"',
      'id="code-1x54bn8"',
      'name="prompt-1f7w6az-view"',
      'id="prompt-1f7w6az-preview"',
      'name="prompt-1f7w6az-view"',
      'id="prompt-1f7w6az-markdown"',
      'id="task-1"',
      'name="tabs-70d0f6d2"',
      'id="tabs-70d0f6d2-0"',
      'name="tabs-70d0f6d2"',
      'id="tabs-70d0f6d2-1"',
      'id="code-1x54bn8-2"',
      'id="prompt-1f7w6az"',
      'name="q"',
      'name="prompt"',
      'id="task-2"',
      'name="tabs-74db87f3"',
      'id="tabs-74db87f3-0"',
      'name="tabs-74db87f3"',
      'id="tabs-74db87f3-1"',
      'id="code-1x54bn8-3"'
    ]);
  });

  // A prompt is text for an AI, not part of the page's prose: a definition in it must not turn the page's brackets into links, and its own brackets are what the reader will paste, so the page's definitions don't apply to them.
  it("keeps the page's link definitions and a preview's apart", () => {
    expect(
      attributes(html, `href`).filter((href) => href.includes(`.example`))
    ).toEqual([
      'href="https://page.example"',
      'href="https://prompt.example"',
      'href="https://page.example"'
    ]);
  });

  it.each(others)("renders the same in %s", (_, engine) => {
    expect(engine()(input)).toBe(html);
  });

  // Footnotes, unlike link definitions, are the page's: remark and Sätteri collect a preview's with the document's, by label. The guide says so and tells authors to give a prompt's footnotes labels of their own; this pins that the two engines at least fail the same way (markdown-it's preset has no footnotes).
  it("a preview's footnote that reuses a label of the page's points at the page's note, in remark and Sätteri alike", () => {
    const [[, remark], [, satteri]] = others;
    const footnotes =
      "Doc[^1]\n\n[^1]: doc note\n\n```prompt open\nP[^1]\n\n[^1]: prompt note\n```";
    const rendered = remark()(footnotes);
    expect(rendered).toContain(
      '<p>P<sup><a href="#user-content-fn-1" id="user-content-fnref-1-2"'
    );
    expect(rendered).not.toContain(`<p>prompt note`);
    expect(satteri()(footnotes)).toBe(rendered);
  });
});
