import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { steps } from "../../packages/mdit-steps/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/steps.md"),
  read("expected/steps.html")
);

const md = new MarkdownIt().use(steps);

describe("steps/mdit", () => {
  it.each(cases)("steps (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });
});

// A step's body is tokenized from its own text, so a body token's `map` counts the body's lines, not the document's. The body's open token carries that text as `meta.attrsSource`, which is where attrs and caption read a body token's lines from; this pins the pair, since reading `map` against the document gives the wrong lines without any error.
describe("steps/mdit: a body token's map indexes the body's own source", () => {
  it("resolves to the token's text through attrsSource, not through the document", () => {
    const src = "Intro.\n\n@1. Step\n> first\n>\n> second paragraph";
    const tokens = new MarkdownIt().use(steps).parse(src, {});
    const open = tokens.find((token) => token.type === "steps_body_open");
    const meta = open?.meta as { attrsSource?: string } | undefined;
    const body = meta?.attrsSource ?? "";
    const second = tokens.filter((token) => token.type === "paragraph_open")[2];
    const [start, end] = second?.map ?? [-1, -1];
    expect(body.split("\n").slice(start, end)).toEqual(["second paragraph"]);
    expect(src.split("\n").slice(start, end)).not.toEqual([
      "> second paragraph"
    ]);
  });
});
