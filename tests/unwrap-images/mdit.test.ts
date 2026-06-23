import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unwrapImages } from "../../packages/mdit-unwrap-images/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/unwrap-images.md"),
  read("expected/unwrap-images.html")
);

const md = new MarkdownIt().use(unwrapImages);
const render = (src: string) => normalizeHtml(md.render(src));

describe("unwrap-images (markdown-it)", () => {
  it.each(cases)(
    "unwrap-images (markdown-it): $name",
    ({ input, expected }) => {
      expect(render(input)).toBe(expected);
    }
  );
});

// mdit-specific: trailing whitespace after image url is stripped
describe("unwrap-images (markdown-it): block image with trailing whitespace", () => {
  const input = "![alt text](example.png)   ";
  const expected = '<img src="example.png" alt="alt text">';
  it("unwraps", () => expect(render(input)).toBe(expected));
});

// mdit-specific: two images on consecutive lines (softbreak between) — both unwrapped
describe("unwrap-images (markdown-it): two images on consecutive lines", () => {
  const input = "![first](a.png)\n![second](b.png)";
  const expected =
    '<img src="a.png" alt="first"><img src="b.png" alt="second">';
  it("unwraps both", () => expect(render(input)).toBe(expected));
});

// mdit-specific: two block images separated by blank line — each in its own paragraph
describe("unwrap-images (markdown-it): two block images separated by blank line", () => {
  const input = "![first](a.png)\n\n![second](b.png)";
  const expected =
    '<img src="a.png" alt="first"><img src="b.png" alt="second">';
  it("unwraps both", () => expect(render(input)).toBe(expected));
});

// mdit-specific: softbreak with preceding text keeps the paragraph
describe("unwrap-images (markdown-it): image preceded by text on same paragraph", () => {
  const input = "Text before\n![alt](img.png)";
  const expected = '<p>Text before\n<img src="img.png" alt="alt"></p>';
  it("leaves paragraph intact", () => expect(render(input)).toBe(expected));
});

// mdit-specific: softbreak with following text keeps the paragraph
describe("unwrap-images (markdown-it): image followed by text on same paragraph", () => {
  const input = "![alt](img.png)\ntext after";
  const expected = '<p><img src="img.png" alt="alt">\ntext after</p>';
  it("leaves paragraph intact", () => expect(render(input)).toBe(expected));
});
