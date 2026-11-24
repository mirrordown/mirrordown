import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { imageSize } from "../../packages/mdit-image-size/src";
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

const md = new MarkdownIt().use(imageSize);

describe("image-size/mdit", () => {
  it.each(cmCases)("image-size (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(gfmCases)(
    "image-size (markdown-it) gfm: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );

  // A plugin added after this one reads the image from its token: the alt comes from its children, which hold the description without the size, and the size is in its attributes.
  it("leaves the image token as later plugins read it", () => {
    const seen: unknown[] = [];
    const reader = new MarkdownIt().use(imageSize).use((later) => {
      later.core.ruler.push("read_images", (state) => {
        for (const block of state.tokens) {
          for (const token of block.children ?? []) {
            if (token.type !== "image") continue;
            seen.push({
              alt: later.renderer.renderInlineAsText(
                token.children ?? [],
                later.options,
                state.env
              ),
              content: token.content,
              attrs: token.attrs?.map((attr) => [...attr])
            });
          }
        }
      });
    });
    reader.render("![*Engel*bart|100x145](e.jpg)");
    expect(seen).toEqual([
      {
        alt: "Engelbart",
        content: "Engelbart",
        attrs: [
          ["src", "e.jpg"],
          ["alt", ""],
          ["width", "100"],
          ["height", "145"]
        ]
      }
    ]);
  });
});
