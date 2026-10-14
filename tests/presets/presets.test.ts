import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import type { UnifiedProcessorOptions } from "@astrojs/markdown-remark";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import {
  mirrordown as markdownItPreset,
  type MirrordownOptions as MarkdownItOptions
} from "../../packages/preset-markdown-it/src";
import {
  mirrordown as remarkPreset,
  type MirrordownOptions as RemarkOptions
} from "../../packages/preset-remark/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const markdownIt = (options: MarkdownItOptions = {}) => {
  const md = new MarkdownIt().use(markdownItPreset, options);
  return (input: string): string => normalizeHtml(md.render(input));
};

const remark = (options: RemarkOptions = {}) => {
  const preset = remarkPreset(options);
  const processor = unified()
    .use(remarkParse)
    .use(preset.remarkPlugins)
    .use(remarkRehype, preset.remarkRehype)
    .use(preset.rehypePlugins)
    .use(rehypeStringify);
  return (input: string): string =>
    normalizeHtml(String(processor.processSync(input)));
};

const engines = [
  ["markdown-it", markdownIt],
  ["remark", remark]
] as const;

// Every feature's shared fixtures, minus inline-svg (not in the presets), engine-specific files, and the GFM and raw-HTML variants whose baselines differ between the engines themselves.
const testsDir = join(import.meta.dirname, "..");
const fixtureCases = readdirSync(testsDir)
  .filter(
    (feature) =>
      feature !== "inline-svg" &&
      existsSync(join(testsDir, feature, "fixtures"))
  )
  .flatMap((feature) =>
    readdirSync(join(testsDir, feature, "fixtures"))
      .filter(
        (file) =>
          file.endsWith(".md") &&
          !/-(mdit|remd|gfm|html|no-icons)\.md$/.test(file) &&
          existsSync(
            join(testsDir, feature, "expected", file.replace(/\.md$/, ".html"))
          )
      )
      .flatMap((file) =>
        parseFixture(
          readFileSync(join(testsDir, feature, "fixtures", file), "utf8"),
          readFileSync(
            join(testsDir, feature, "expected", file.replace(/\.md$/, ".html")),
            "utf8"
          )
        ).map(({ name, input }) => ({ name: `${file} › ${name}`, input }))
      )
  );

describe("presets", () => {
  // The presets' promise: the whole suite composes, and a document renders the same whichever engine you choose.
  describe("with every feature on, both engines render the same", () => {
    const md = markdownIt();
    const rm = remark();
    it.each(fixtureCases)("$name", ({ input }) => {
      expect(md(input)).toBe(rm(input));
    });
  });

  // Each sample's `marker` is in the output when the feature is on, unless `absentWhenOn` (features that remove something).
  const features: readonly {
    key: keyof MarkdownItOptions & keyof RemarkOptions;
    input: string;
    marker: string;
    absentWhenOn?: boolean;
  }[] = [
    {
      key: "abbr",
      input: "*[HTML]: Hyper Text\n\nSome HTML.",
      marker: "<abbr"
    },
    { key: "attrs", input: "Text {.note}", marker: 'class="note"' },
    { key: "autolinkHeadings", input: "# Title", marker: 'class="anchor"' },
    { key: "definitionList", input: "Term\n: Definition", marker: "<dl>" },
    { key: "del", input: "a --gone-- b", marker: "<del>" },
    {
      key: "githubAlerts",
      input: "> [!NOTE]\n> Body",
      marker: "markdown-alert"
    },
    { key: "ins", input: "a ++new++ b", marker: "<ins>" },
    { key: "kbd", input: "[[Ctrl]]", marker: "<kbd>" },
    { key: "lightbox", input: "!![Alt](pic.png)", marker: "<dialog" },
    { key: "mark", input: "==hi==", marker: "<mark>" },
    { key: "ruby", input: "{漢字|かんじ}", marker: "<ruby>" },
    { key: "sectionize", input: "# Title\n\nText", marker: "<section" },
    { key: "slug", input: "## Sub Title", marker: 'id="sub-title"' },
    { key: "spoiler", input: "a ||secret|| b", marker: "markdown-spoiler" },
    {
      key: "squeezeParagraphs",
      input: "{.x}\n\nText",
      marker: '<p class="x"></p>',
      absentWhenOn: true
    },
    { key: "steps", input: "@1. First\n> Do it", marker: "markdown-steps" },
    { key: "sub", input: "H~2~O", marker: "<sub>" },
    { key: "sup", input: "x^2^", marker: "<sup>" },
    { key: "tabs", input: "% One\n> a\n% Two\n> b", marker: "markdown-tabs" },
    {
      key: "unwrapImages",
      input: "![Alt](pic.png)",
      marker: "<p><img",
      absentWhenOn: true
    }
  ];

  describe.each(engines)("%s", (_, render) => {
    it.each(features)(
      "$key is on by default and `false` turns it off",
      ({ key, input, marker, absentWhenOn = false }) => {
        expect(render()(input).includes(marker)).toBe(!absentWhenOn);
        expect(render({ [key]: false })(input).includes(marker)).toBe(
          absentWhenOn
        );
      }
    );

    it("passes an options object to its plugin", () => {
      expect(
        render({ githubAlerts: { icons: false } })("> [!NOTE]\n> Body")
      ).not.toContain("<svg");
      expect(render({ slug: { prefix: "doc-" } })("## Sub Title")).toContain(
        'id="doc-sub-title"'
      );
    });
  });

  describe("preset-remark", () => {
    // Plain remark-gfm reads `~2~` as strikethrough before remd-sub sees it; the preset's own GFM must leave single tildes to subscript.
    it("includes GFM, configured so `~sub~` is still subscript", () => {
      const html = remark()("H~2~O and ~~gone~~");
      expect(html).toContain("H<sub>2</sub>O");
      expect(html).toContain("<del>gone</del>");
      expect(remark({ gfm: false })("~~gone~~")).not.toContain("<del>");
    });

    // Processors such as Astro's `unified()` add their own GFM and smart punctuation unless told not to; either would undo what the preset configures. The annotation is checked by `vp check`: a typed astro.config.ts must take the preset as it is, `processor: unified(mirrordown())`.
    it("fits Astro's `unified()` processor and tells it not to add GFM or smart punctuation", () => {
      const options: UnifiedProcessorOptions = remarkPreset();
      expect(options).toMatchObject({ gfm: false, smartypants: false });
    });

    // The README's way to opt back into smart punctuation.
    it("can be overridden to turn smart punctuation back on", () => {
      const options: UnifiedProcessorOptions = {
        ...remarkPreset(),
        smartypants: true
      };
      expect(options.smartypants).toBe(true);
    });
  });
});
