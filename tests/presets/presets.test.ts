import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import type { UnifiedProcessorOptions } from "@astrojs/markdown-remark";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import {
  mirrordown as markdownItPreset,
  type MirrordownOptions as MarkdownItOptions
} from "../../packages/preset-markdown-it/src";
import {
  mirrordown as satteriPreset,
  type MirrordownOptions as SatteriOptions
} from "../../packages/preset-satteri/src";
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

const satteri = (options: SatteriOptions = {}) => {
  const preset = satteriPreset(options);
  return (input: string): string =>
    normalizeHtml(markdownToHtml(input, preset).html);
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
        ).map(({ name, input }) => ({
          feature,
          name: `${file} › ${name}`,
          input
        }))
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

    // Attrs apply after the containers are built, so a step title's or tab label's attrs reach its item rather than being lost with the header paragraph.
    it("applies attrs to step titles and tab labels", () => {
      const input = "@1. Step {.step}\n> Body.\n\n% Tab {.tab}\n> Panel.";
      for (const html of [md(input), rm(input)]) {
        expect(html).toContain('<li class="markdown-steps-item step"');
        expect(html).toContain('<label class="markdown-tabs-label tab"');
      }
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

  describe("preset-satteri", () => {
    // Sätteri has these features so far; the rest arrive as their ports land.
    const satteriFeatures = [
      "abbr",
      "autolink-headings",
      "del",
      "github-alerts",
      "ins",
      "kbd",
      "lightbox",
      "mark",
      "ruby",
      "sectionize",
      "slug",
      "spoiler",
      "squeeze-paragraphs",
      "steps",
      "sub",
      "sup",
      "unwrap-images"
    ];
    const remarkWithSatteriFeatures = remark({
      attrs: false,
      definitionList: false,
      tabs: false
    });
    const sat = satteri();
    it.each(
      fixtureCases.filter(({ feature }) => satteriFeatures.includes(feature))
    )("renders what preset-remark does: $name", ({ input }) => {
      expect(sat(input)).toBe(remarkWithSatteriFeatures(input));
    });

    it.each(
      features.filter(
        (
          sample
        ): sample is (typeof features)[number] & {
          key: keyof SatteriOptions;
        } =>
          [
            "abbr",
            "autolinkHeadings",
            "del",
            "githubAlerts",
            "ins",
            "kbd",
            "lightbox",
            "mark",
            "ruby",
            "sectionize",
            "slug",
            "spoiler",
            "steps",
            "sub",
            "sup",
            "unwrapImages"
          ].includes(sample.key)
      )
    )(
      "$key is on by default and `false` turns it off",
      ({ key, input, marker, absentWhenOn = false }) => {
        expect(satteri()(input).includes(marker)).toBe(!absentWhenOn);
        expect(satteri({ [key]: false })(input).includes(marker)).toBe(
          absentWhenOn
        );
      }
    );

    // squeeze-paragraphs removes the empty paragraphs other plugins leave, and no Sätteri plugin leaves one until attrs is ported, so its sample can't show it working; check that `false` drops it from the plugins instead.
    it("squeezeParagraphs is on by default and `false` drops it", () => {
      const names = (options: SatteriOptions) =>
        satteriPreset(options).hastPlugins.map(
          (plugin) => plugin({} as never).name
        );
      expect(names({})).toContain("squeeze-paragraphs");
      expect(names({ squeezeParagraphs: false })).not.toContain(
        "squeeze-paragraphs"
      );
    });

    it("passes an options object to its plugin", () => {
      expect(
        satteri({ githubAlerts: { icons: false } })("> [!NOTE]\n> Body")
      ).not.toContain("<svg");
      expect(satteri({ slug: { prefix: "doc-" } })("## Sub Title")).toContain(
        'id="doc-sub-title"'
      );
    });

    // Hosts such as Astro turn smart punctuation on unless the features say otherwise; it would rewrite delimiters the plugins read.
    it("keeps smart punctuation off unless asked", () => {
      expect(satteri()('"quoted"')).toBe('<p>"quoted"</p>');
      expect(
        satteri({ features: { smartPunctuation: true } })('"quoted"')
      ).toBe("<p>“quoted”</p>");
    });

    // `.html` on the result is checked by `vp check`: the preset's plugin types keep `markdownToHtml` synchronous.
    it("keeps markdownToHtml synchronous", () => {
      const { html } = markdownToHtml("==hi==", satteriPreset());
      expect(html).toContain("<mark>hi</mark>");
    });
  });
});
