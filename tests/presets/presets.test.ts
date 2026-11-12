import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import type { UnifiedProcessorOptions } from "@astrojs/markdown-remark";
import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";
import { markdownToHtml } from "satteri";
import { mirrordown as satteriPreset } from "../../packages/preset-satteri/src";
import { mirrordown as remarkPreset } from "../../packages/preset-remark/src";
import { parseFixture } from "../utils/index.js";
import { options as mermaidPele } from "../mermaid-pele/options.js";
import {
  engines,
  markdownIt,
  remark,
  satteri,
  type MarkdownItOptions,
  type RemarkOptions,
  type SatteriOptions
} from "./engines.js";

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
  describe("with every feature on, all three engines render the same", () => {
    // Gantt charts mark "today", so it's fixed, as in the mermaid-pele suites.
    const md = markdownIt({ mermaidPele });
    const rm = remark({ mermaidPele });
    const sat = satteri({ mermaidPele });
    it.each(fixtureCases)("$name", ({ input }) => {
      const expected = rm(input);
      expect(md(input)).toBe(expected);
      expect(sat(input)).toBe(expected);
    });

    // Attrs apply after the containers are built, so a step title's or tab label's attrs reach its item rather than being lost with the header paragraph.
    it("applies attrs to step titles and tab labels", () => {
      const input = "@1. Step {.step}\n> Body.\n\n% Tab {.tab}\n> Panel.";
      for (const html of [md(input), rm(input), sat(input)]) {
        expect(html).toContain('<li class="markdown-steps-item step"');
        expect(html).toContain('<label class="markdown-tabs-label tab"');
      }
      expect(md(input)).toBe(rm(input));
      expect(sat(input)).toBe(rm(input));
    });

    // Sätteri reads the block that ends a header's paragraph before recognition, and leaves one in the middle as text; either way the item gets it.
    it("applies attrs to a header in the middle of its paragraph", () => {
      const input = "@1. One {.one}\n@1. Two {.two}\n>  Body.";
      for (const html of [md(input), rm(input), sat(input)]) {
        expect(html).toContain('<li class="markdown-steps-item one"');
        expect(html).toContain('<li class="markdown-steps-item two"');
      }
      expect(md(input)).toBe(rm(input));
      expect(sat(input)).toBe(rm(input));
    });
  });

  // Each sample's `marker` is in the output when the feature is on, unless `absentWhenOn` (features that remove something).
  const features: readonly {
    key: keyof MarkdownItOptions & keyof RemarkOptions & keyof SatteriOptions;
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
    {
      key: "caption",
      input: "```\ncode\n```\n~: A caption",
      marker: "<figcaption>"
    },
    {
      key: "copyCode",
      input: "```sh\nnpm test\n```",
      marker: 'class="markdown-copy-code"'
    },
    { key: "definitionList", input: "Term\n: Definition", marker: "<dl>" },
    { key: "del", input: "a --gone-- b", marker: "<del>" },
    {
      key: "fileTree",
      input: "```filetree\nsrc/\n  index.ts\n```",
      marker: 'class="markdown-file-tree"'
    },
    {
      key: "githubAlerts",
      input: "> [!NOTE]\n> Body",
      marker: "markdown-alert"
    },
    { key: "ins", input: "a ++new++ b", marker: "<ins>" },
    { key: "kbd", input: "[[Ctrl]]", marker: "<kbd>" },
    { key: "lightbox", input: "!![Alt](pic.png)", marker: "<dialog" },
    { key: "mark", input: "==hi==", marker: "<mark>" },
    {
      key: "mermaidPele",
      input: "```mermaid\nflowchart LR\n  A --> B\n```",
      marker: 'class="pele pele-flowchart"'
    },
    {
      key: "prompt",
      input: "```prompt\nSummarize this page.\n```",
      marker: 'class="markdown-prompt"'
    },
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
      key: "tabIcons",
      input: "% npm\n> a\n% pnpm\n> b",
      marker: "markdown-tab-icon"
    },
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

  // tab-icons finds the tabs plugin's groups by class. A preset that renamed the groups without telling tab-icons would drop every icon and leave the `[!keyword]` markers in the labels.
  it("tab-icons follows the tabs plugin's `containerClass`", () => {
    const options = { tabs: { containerClass: "my-tabs" } };
    const input = "% npm\n> Body.\n% [!yarn] Y\n> Body.";
    const html = remark(options)(input);
    expect(html.match(/markdown-tab-icon/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Y"');
    expect(markdownIt(options)(input)).toBe(html);
    expect(satteri(options)(input)).toBe(html);
  });

  // An explicit tab-icons class still wins: with a different one it looks for groups that are not there.
  it("tab-icons keeps a `containerClass` of its own", () => {
    const options = {
      tabs: { containerClass: "my-tabs" },
      tabIcons: { containerClass: "other" }
    };
    for (const [, render] of engines) {
      expect(render(options)("% npm\n> Body.")).not.toContain(
        "markdown-tab-icon"
      );
    }
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
    // The annotation is checked by `vp check`: a typed astro.config.ts must take the preset as it is, `processor: satteri(mirrordown())`, plugin factories included. Astro turns smart punctuation on by default, which would undo what the preset configures.
    it("fits Astro's `satteri()` processor and tells it not to add smart punctuation", () => {
      const options: SatteriProcessorOptions = satteriPreset();
      expect(options.features).toMatchObject({ smartPunctuation: false });
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
