import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it, describe } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeUnwrapImages } from "../../packages/remd-unwrap-images/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/unwrap-images.md"),
  read("expected/unwrap-images.html")
);

const process = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeUnwrapImages)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

describe("unwrap-images (rehype)", () => {
  it.each(cases)("unwrap-images (rehype): $name", ({ input, expected }) => {
    expect(process(input)).toBe(expected);
  });
});

// rehype-specific: two block images separated by blank line — both unwrapped
describe("unwrap-images (rehype): two block images separated by blank line", () => {
  const input = "![first](a.png)\n\n![second](b.png)";
  const expected =
    '<img src="a.png" alt="first"><img src="b.png" alt="second">';
  it("unwraps both", () => expect(process(input)).toBe(expected));
});

// rehype-specific: image wrapped in a link — link+image unwrapped together
describe("unwrap-images (rehype): image in a link", () => {
  const input = "[![alt](img.png)](https://example.com)";
  const expected =
    '<a href="https://example.com"><img src="img.png" alt="alt"></a>';
  it("unwraps the linked image", () => expect(process(input)).toBe(expected));
});

// rehype-specific: image in link alongside text — stays wrapped
describe("unwrap-images (rehype): image in link with other text", () => {
  const input = "[![alt](img.png) caption](https://example.com)";
  const expected =
    '<p><a href="https://example.com"><img src="img.png" alt="alt"> caption</a></p>';
  it("leaves paragraph intact", () => expect(process(input)).toBe(expected));
});
