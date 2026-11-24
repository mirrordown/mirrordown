import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import type { Image, Root } from "mdast";
import { remarkImageSize } from "../../packages/remd-image-size/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/image-size-commonmark.md"),
  read("expected/image-size-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/image-size-gfm.md"),
  read("expected/image-size-gfm.html")
);

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkImageSize)
  .use(remarkRehype)
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkImageSize)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("image-size/remd", () => {
  it.each(cmCases)("image-size (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(gfmCases)("image-size (remark) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  // A remark plugin after this one reads the image node: its alt without the size, and the size where mdast-util-to-hast takes the `<img>`'s attributes from.
  it("leaves the image node as later plugins read it", () => {
    const processor = unified().use(remarkParse).use(remarkImageSize);
    const tree: Root = processor.runSync(
      processor.parse("![*Engel*bart|100x145](e.jpg)")
    );
    const paragraph = tree.children[0];
    const image =
      paragraph?.type === "paragraph"
        ? (paragraph.children[0] as Image)
        : undefined;
    expect(image?.alt).toBe("Engelbart");
    expect(image?.data).toEqual({
      hProperties: { width: "100", height: "145" }
    });
  });
});
