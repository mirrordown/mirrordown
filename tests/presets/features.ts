import type {
  MarkdownItOptions,
  RemarkOptions,
  SatteriOptions
} from "./engines.js";

// One sample per preset feature, shared by the presets' own tests and by the render tool (`scripts/render.mjs`), which reads the keys to turn features off. A new feature needs a row here.
// Each sample's `marker` is in the output when the feature is on, unless `absentWhenOn` (features that remove something).
export const features: ReadonlyArray<{
  key: keyof MarkdownItOptions & keyof RemarkOptions & keyof SatteriOptions;
  input: string;
  marker: string;
  absentWhenOn?: boolean;
}> = [
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
  { key: "imageSize", input: "![Alt|100](pic.png)", marker: 'width="100"' },
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
