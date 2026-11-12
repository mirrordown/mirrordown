import type { Features, PluginFactoryContext } from "satteri";
import { satteriAbbr, type AbbrPlugin } from "@mirrordown/sat-abbr";
import { satteriCaption, type CaptionPlugin } from "@mirrordown/sat-caption";
import {
  satteriCopyCode,
  type CopyCodeOptions,
  type CopyCodePlugin
} from "@mirrordown/sat-copy-code";
import {
  satteriFileTree,
  type FileTreeOptions,
  type FileTreePlugin
} from "@mirrordown/sat-file-tree";
import {
  satteriPrompt,
  satteriPromptPreview,
  type PromptOptions,
  type PromptPlugin,
  type PromptPreviewPlugin
} from "@mirrordown/sat-prompt";
import {
  satteriAutolinkHeadings,
  type AutolinkHeadingsOptions,
  type AutolinkHeadingsPlugin
} from "@mirrordown/sat-autolink-headings";
import {
  satteriGithubAlerts,
  type AlertOptions,
  type GithubAlertsPlugin
} from "@mirrordown/sat-github-alerts";
import { satteriDel, type DelPlugin } from "@mirrordown/sat-del";
import { satteriIns, type InsPlugin } from "@mirrordown/sat-ins";
import { satteriKbd, type KbdPlugin } from "@mirrordown/sat-kbd";
import {
  satteriLightbox,
  type LightboxOptions,
  type LightboxPlugin
} from "@mirrordown/sat-lightbox";
import { satteriMark, type MarkPlugin } from "@mirrordown/sat-mark";
import {
  satteriMermaidPele,
  type MermaidPelePlugin,
  type SatteriMermaidPeleOptions
} from "@mirrordown/sat-mermaid-pele";
import {
  satteriRuby,
  type RubyOptions,
  type RubyPlugin
} from "@mirrordown/sat-ruby";
import {
  satteriSlug,
  type SlugOptions,
  type SlugPlugin
} from "@mirrordown/sat-slug";
import {
  satteriSectionize,
  type SectionizePlugin
} from "@mirrordown/sat-sectionize";
import { satteriSpoiler, type SpoilerPlugin } from "@mirrordown/sat-spoiler";
import {
  satteriSteps,
  type StepsOptions,
  type StepsPlugin
} from "@mirrordown/sat-steps";
import {
  satteriTabs,
  type TabsOptions,
  type TabsPlugin
} from "@mirrordown/sat-tabs";
import {
  satteriTabIcons,
  type TabIconsOptions,
  type TabIconsPlugin
} from "@mirrordown/sat-tab-icons";
import {
  satteriSqueezeParagraphs,
  type SqueezeParagraphsPlugin
} from "@mirrordown/sat-squeeze-paragraphs";
import {
  satteriUnwrapImages,
  type UnwrapImagesPlugin
} from "@mirrordown/sat-unwrap-images";

/** Every feature is on by default: `false` turns one off, an options object configures it. */
export interface MirrordownOptions {
  /** GitHub Flavored Markdown: tables, strikethrough, task lists, autolink literals and footnotes. */
  gfm?: boolean;
  abbr?: boolean;
  /** Sätteri's built-in `attributes` feature, which takes no options. */
  attrs?: boolean;
  autolinkHeadings?: boolean | AutolinkHeadingsOptions;
  caption?: boolean;
  copyCode?: boolean | CopyCodeOptions;
  /** Sätteri's built-in `definitionList` feature. */
  definitionList?: boolean;
  del?: boolean;
  fileTree?: boolean | FileTreeOptions;
  githubAlerts?: boolean | AlertOptions;
  ins?: boolean;
  kbd?: boolean;
  lightbox?: boolean | LightboxOptions;
  mark?: boolean;
  mermaidPele?: boolean | SatteriMermaidPeleOptions;
  prompt?: boolean | PromptOptions;
  /** Ruby's own options; its `features` are always the preset's. */
  ruby?: boolean | Omit<RubyOptions, `features`>;
  sectionize?: boolean;
  slug?: boolean | SlugOptions;
  spoiler?: boolean;
  squeezeParagraphs?: boolean;
  steps?: boolean | StepsOptions;
  /** Sätteri's built-in `subscript` feature. */
  sub?: boolean;
  /** Sätteri's built-in `superscript` feature. */
  sup?: boolean;
  tabs?: boolean | TabsOptions;
  tabIcons?: boolean | TabIconsOptions;
  unwrapImages?: boolean;
  /** Further Sätteri features, such as `math` or `smartPunctuation`. These win over the preset's. */
  features?: Features;
}

/** A plugin factory: Sätteri calls it once per document, so per-document state starts fresh. */
type Factory<P> = (ctx: PluginFactoryContext) => P;

/**
 * The suite as Sätteri compile options, for `markdownToHtml(source, mirrordown())` or Astro's `satteri(mirrordown())`. The plugin lists name the plugins' own synchronous types, so `markdownToHtml` returns its result directly rather than a Promise.
 */
export interface MirrordownPreset {
  features: Features;
  mdastPlugins: Array<
    | Factory<AbbrPlugin>
    | Factory<CaptionPlugin>
    | Factory<DelPlugin>
    | Factory<GithubAlertsPlugin>
    | Factory<InsPlugin>
    | Factory<KbdPlugin>
    | Factory<MarkPlugin>
    | Factory<PromptPreviewPlugin>
    | Factory<RubyPlugin>
    | Factory<SpoilerPlugin>
    | Factory<StepsPlugin>
    | Factory<TabsPlugin>
  >;
  hastPlugins: Array<
    | Factory<AutolinkHeadingsPlugin>
    | Factory<CopyCodePlugin>
    | Factory<FileTreePlugin>
    | Factory<LightboxPlugin>
    | Factory<MermaidPelePlugin>
    | Factory<PromptPlugin>
    | Factory<SectionizePlugin>
    | Factory<SlugPlugin>
    | Factory<SqueezeParagraphsPlugin>
    | Factory<TabIconsPlugin>
    | Factory<UnwrapImagesPlugin>
  >;
}

/**
 * The Mirrordown suite for Sätteri. `inline-svg` is not included: it reads files from disk, so add `@mirrordown/sat-inline-svg` to `hastPlugins` yourself where that fits. `features` sets `smartPunctuation: false` explicitly, because hosts such as Astro turn it on by default and it rewrites delimiters some plugins read; pass `features: { smartPunctuation: true }` to turn it back on.
 */
export const mirrordown = (
  options: MirrordownOptions = {}
): MirrordownPreset => {
  // `true` (or unset) uses the plugin's defaults.
  const settings = <O>(setting: boolean | O | undefined): O | undefined =>
    typeof setting === `boolean` ? undefined : setting;

  const features: Features = {
    gfm: options.gfm !== false,
    attributes: options.attrs !== false,
    definitionList: options.definitionList !== false,
    smartPunctuation: false,
    subscript: options.sub !== false,
    superscript: options.sup !== false,
    ...options.features
  };

  // tab-icons finds the tabs plugin's groups by class, so it takes the tabs plugin's `containerClass` unless given its own.
  const tabsClass =
    typeof options.tabs === `object` ? options.tabs.containerClass : undefined;
  const tabIconsSetting =
    options.tabIcons === false || tabsClass === undefined
      ? options.tabIcons
      : {
          containerClass: tabsClass,
          ...(typeof options.tabIcons === `object` ? options.tabIcons : {})
        };

  return {
    features,
    // Prompt previews first: the plugins after them see a prompt's preview as part of the page. Then ruby: it re-reads its blocks from source, which nodes built by other plugins don't have. Kbd before del, ins, mark and spoiler: a key's brackets isolate the delimiters inside it, as in markdown-it. Tabs after the inline plugins: a panel's aria-label is its label's text when tabs renders, so they must have run. Alerts after the inline plugins for the same reason (a title's aria-label), and after steps and tabs, whose headers take the marker line directly under them as body text. Caption last, after the containers whose blocks it captions.
    mdastPlugins: [
      ...(options.prompt === false ? [] : [satteriPromptPreview()]),
      ...(options.ruby === false ? [] : [satteriRuby(settings(options.ruby))]),
      ...(options.kbd === false ? [] : [satteriKbd()]),
      ...(options.del === false ? [] : [satteriDel()]),
      ...(options.ins === false ? [] : [satteriIns()]),
      ...(options.mark === false ? [] : [satteriMark()]),
      ...(options.steps === false
        ? []
        : [satteriSteps(settings(options.steps))]),
      ...(options.spoiler === false ? [] : [satteriSpoiler()]),
      ...(options.tabs === false ? [] : [satteriTabs(settings(options.tabs))]),
      ...(options.githubAlerts === false
        ? []
        : [satteriGithubAlerts(settings(options.githubAlerts))]),
      // After the delimiter plugins and alerts, as markdown-it applies abbreviations once inline parsing is done.
      ...(options.abbr === false ? [] : [satteriAbbr()]),
      // After the containers, whose blocks it captions.
      ...(options.caption === false ? [] : [satteriCaption()])
    ],
    // In plugin order: mermaid-pele first (the plugins after it see the diagrams' <svg>, and copy-code no longer sees them as code blocks), then file-tree and prompt (copy-code no longer sees the trees or prompts as code blocks either), sectionize before slug and autolink-headings (they still find the nested headings), lightbox before unwrap-images (it drops the text its marker empties), squeeze-paragraphs last (it removes the residue of the others).
    hastPlugins: [
      ...(options.mermaidPele === false
        ? []
        : [satteriMermaidPele(settings(options.mermaidPele))]),
      ...(options.fileTree === false
        ? []
        : [satteriFileTree(settings(options.fileTree))]),
      ...(options.prompt === false
        ? []
        : [satteriPrompt(settings(options.prompt))]),
      ...(options.copyCode === false
        ? []
        : [satteriCopyCode(settings(options.copyCode))]),
      ...(tabIconsSetting === false
        ? []
        : [satteriTabIcons(settings(tabIconsSetting))]),
      ...(options.sectionize === false ? [] : [satteriSectionize()]),
      ...(options.slug === false ? [] : [satteriSlug(settings(options.slug))]),
      ...(options.autolinkHeadings === false
        ? []
        : [satteriAutolinkHeadings(settings(options.autolinkHeadings))]),
      ...(options.lightbox === false
        ? []
        : [satteriLightbox(settings(options.lightbox))]),
      ...(options.unwrapImages === false ? [] : [satteriUnwrapImages()]),
      ...(options.squeezeParagraphs === false
        ? []
        : [satteriSqueezeParagraphs()])
    ]
  };
};
