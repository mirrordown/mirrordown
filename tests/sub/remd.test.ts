import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkSub } from "../../packages/remd-sub/src";
import { remarkSup } from "../../packages/remd-sup/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/sub-commonmark.md"),
  read("expected/sub-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/sub-gfm.md"),
  read("expected/sub-gfm.html")
);

const crossNodeCases = parseFixture(
  read("fixtures/sub-cross-node.md"),
  read("expected/sub-cross-node.html")
);

const subSupCases = parseFixture(
  read("fixtures/sub-sup.md"),
  read("expected/sub-sup.html")
);

// Both registration orders: which plugin is added first must not change how crossing runs pair.
const subSupOrders = [
  [
    "sub, sup",
    unified()
      .use(remarkParse)
      .use(remarkSub)
      .use(remarkSup)
      .use(remarkRehype)
      .use(rehypeStringify)
  ],
  [
    "sup, sub",
    unified()
      .use(remarkParse)
      .use(remarkSup)
      .use(remarkSub)
      .use(remarkRehype)
      .use(rehypeStringify)
  ]
] as const;

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkSub)
  .use(remarkRehype)
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm, { singleTilde: false })
  .use(remarkSub)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("sub/remd", () => {
  it.each(cmCases)("sub (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(gfmCases)("sub (remark) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  // Letting a `*` run flank a tilde comes from remark-gfm, which registers `~` as an attention marker; without it the asterisks are literal, and markdown-it follows that when its strikethrough is off.
  it("leaves asterisks beside a subscript inside a word literal without GFM", () => {
    expect(normalizeHtml(String(cmProcessor.processSync("x*~i~*")))).toBe(
      "<p>x*<sub>i</sub>*</p>"
    );
  });

  // Crossing spans are malformed, and each engine resolves them its own way: here the construct that appeared first in the paragraph claims its pair, as in Sätteri, while markdown-it (see its test) pairs whichever closer comes first. Pinned so that a change in either is noticed.
  it.each([
    ["*x* ~a *b~ c*", "<p><em>x</em> ~a <em>b~ c</em></p>"],
    ["~x~ *a ~b* c~", "<p><sub>x</sub> *a <sub>b* c</sub></p>"]
  ])(
    "lets the construct seen first win when a subscript crosses emphasis: %s",
    (input, expected) => {
      expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
        expected
      );
    }
  );

  // Both plugins register on `~`, and micromark tries the construct registered last first. So with remark-gfm's default single-tilde strikethrough the order decides who gets `~text~`; `singleTilde: false` is what makes the order irrelevant.
  describe("with remark-gfm's default single-tilde strikethrough", () => {
    const render = (plugins: PluggableList): string =>
      normalizeHtml(
        String(
          unified()
            .use(remarkParse)
            .use(plugins)
            .use(remarkRehype)
            .use(rehypeStringify)
            .processSync("H~2~O ~~x~~")
        )
      );

    it("reads `~text~` as subscript when remarkSub is added after remarkGfm", () => {
      expect(render([remarkGfm, remarkSub])).toBe(
        "<p>H<sub>2</sub>O <del>x</del></p>"
      );
    });

    it("reads `~text~` as strikethrough when remarkSub is added before remarkGfm", () => {
      expect(render([remarkSub, remarkGfm])).toBe(
        "<p>H<del>2</del>O <del>x</del></p>"
      );
    });

    it("reads `~text~` as subscript in either order once `singleTilde` is off", () => {
      expect(render([remarkSub, [remarkGfm, { singleTilde: false }]])).toBe(
        "<p>H<sub>2</sub>O <del>x</del></p>"
      );
    });
  });

  describe.each(subSupOrders)("with sup (%s)", (_, processor) => {
    it.each(subSupCases)(
      "sub (remark) with sup: $name",
      ({ input, expected }) => {
        expect(normalizeHtml(String(processor.processSync(input)))).toBe(
          expected
        );
      }
    );
  });

  it.each(crossNodeCases)(
    "sub (remark) cross-node: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
        expected
      );
    }
  );
});
