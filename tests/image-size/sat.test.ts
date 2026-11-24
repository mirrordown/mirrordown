import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { defineMdastPlugin, markdownToHtml } from "satteri";
import { satteriImageSize } from "../../packages/sat-image-size/src";
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

const render = (input: string, gfm: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriImageSize()]
    }).html
  );

describe("image-size/sat", () => {
  it.each(cmCases)("image-size (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  it.each(gfmCases)(
    "image-size (sätteri) gfm: $name",
    ({ input, expected }) => {
      expect(render(input, true)).toBe(expected);
    }
  );

  // A Sätteri plugin after this one reads the image node: its alt without the size, and the size in the `hProperties` its `<img>` is written with.
  it("leaves the image node as later plugins read it", () => {
    const seen: unknown[] = [];
    markdownToHtml("![*Engel*bart|100x145](e.jpg)", {
      mdastPlugins: [
        satteriImageSize(),
        () =>
          defineMdastPlugin({
            name: "read-images",
            image(node) {
              seen.push({ alt: node.alt, data: node.data });
            }
          })
      ]
    });
    expect(seen).toEqual([
      {
        alt: "Engelbart",
        data: { hProperties: { width: "100", height: "145" } }
      }
    ]);
  });
});
