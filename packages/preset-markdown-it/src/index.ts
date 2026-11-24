import type MarkdownIt from "markdown-it";
import { abbr } from "@mirrordown/mdit-abbr";
import { attrs, type AttrsOptions } from "@mirrordown/mdit-attrs";
import {
  autolinkHeadings,
  type AutolinkHeadingsOptions
} from "@mirrordown/mdit-autolink-headings";
import { caption } from "@mirrordown/mdit-caption";
import { copyCode, type CopyCodeOptions } from "@mirrordown/mdit-copy-code";
import { dl } from "@mirrordown/mdit-definition-list";
import { del } from "@mirrordown/mdit-del";
import { fileTree, type FileTreeOptions } from "@mirrordown/mdit-file-tree";
import { prompt, type PromptOptions } from "@mirrordown/mdit-prompt";
import {
  githubAlerts,
  type AlertOptions
} from "@mirrordown/mdit-github-alerts";
import { imageSize } from "@mirrordown/mdit-image-size";
import { ins } from "@mirrordown/mdit-ins";
import { kbd } from "@mirrordown/mdit-kbd";
import { lightbox, type LightboxOptions } from "@mirrordown/mdit-lightbox";
import { mark, type MarkOptions } from "@mirrordown/mdit-mark";
import {
  mermaidPele,
  type MermaidPeleOptions
} from "@mirrordown/mdit-mermaid-pele";
import { ruby, type RubyOptions } from "@mirrordown/mdit-ruby";
import { sectionize } from "@mirrordown/mdit-sectionize";
import { slug, type SlugOptions } from "@mirrordown/mdit-slug";
import { spoiler } from "@mirrordown/mdit-spoiler";
import { squeezeParagraphs } from "@mirrordown/mdit-squeeze-paragraphs";
import { steps, type StepsOptions } from "@mirrordown/mdit-steps";
import { sub } from "@mirrordown/mdit-sub";
import { sup } from "@mirrordown/mdit-sup";
import { tabs, type TabsOptions } from "@mirrordown/mdit-tabs";
import { tags, type TagsOptions } from "@mirrordown/mdit-tags";
import { tabIcons, type TabIconsOptions } from "@mirrordown/mdit-tab-icons";
import { unwrapImages } from "@mirrordown/mdit-unwrap-images";

/** Every feature is on by default: `false` turns one off, an options object configures it. */
export interface MirrordownOptions {
  abbr?: boolean;
  attrs?: boolean | AttrsOptions;
  autolinkHeadings?: boolean | AutolinkHeadingsOptions;
  caption?: boolean;
  copyCode?: boolean | CopyCodeOptions;
  definitionList?: boolean;
  del?: boolean;
  fileTree?: boolean | FileTreeOptions;
  githubAlerts?: boolean | AlertOptions;
  imageSize?: boolean;
  ins?: boolean;
  kbd?: boolean;
  lightbox?: boolean | LightboxOptions;
  mark?: boolean | MarkOptions;
  mermaidPele?: boolean | MermaidPeleOptions;
  prompt?: boolean | PromptOptions;
  ruby?: boolean | RubyOptions;
  sectionize?: boolean;
  slug?: boolean | SlugOptions;
  spoiler?: boolean;
  squeezeParagraphs?: boolean;
  steps?: boolean | StepsOptions;
  sub?: boolean;
  sup?: boolean;
  tabs?: boolean | TabsOptions;
  tags?: boolean | TagsOptions;
  tabIcons?: boolean | TabIconsOptions;
  unwrapImages?: boolean;
}

/**
 * The full Mirrordown suite as one markdown-it plugin: `md.use(mirrordown, options)`. `inline-svg` is not included: it reads files from disk, so add `@mirrordown/mdit-inline-svg` yourself where that fits.
 */
export const mirrordown = (
  md: MarkdownIt,
  options: MirrordownOptions = {}
): void => {
  // `true` (or unset) uses the plugin's defaults.
  const configured = <O extends object>(
    setting: boolean | O | undefined,
    plugin: (md: MarkdownIt, options?: O) => void
  ): void => {
    if (setting === false) return;
    md.use(plugin, setting === true ? undefined : setting);
  };
  const on = (
    setting: boolean | undefined,
    plugin: (md: MarkdownIt) => void
  ): void => {
    if (setting !== false) md.use(plugin);
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

  on(options.abbr, abbr);
  // Its rule runs right before `linkify` wherever it is listed: after the rules that make or change an image's description (ruby's verbatim alt, a prompt's preview, an alert's title), before the alert label that reads it and before the image plugins below (caption, lightbox, unwrap-images). Before attrs, whose rule sits there too: an attribute block's `title` then follows the size, as in remark and Sätteri.
  on(options.imageSize, imageSize);
  // Before slug, so explicit `{#id}` attributes win.
  configured(options.attrs, attrs);
  on(options.definitionList, dl);
  on(options.del, del);
  configured(options.githubAlerts, githubAlerts);
  on(options.ins, ins);
  on(options.kbd, kbd);
  configured(options.mark, mark);
  configured(options.ruby, ruby);
  configured(options.steps, steps);
  on(options.spoiler, spoiler);
  on(options.sub, sub);
  on(options.sup, sup);
  configured(options.tabs, tabs);
  // After tabs and attrs: it reads the labels they leave.
  configured(tabIconsSetting, tabIcons);
  // Registered after abbr and alerts: each puts a core rule straight after `linkify`, where the one registered last runs first. Tags are read before abbreviations are marked, as in the other presets, and before an alert's title is labelled.
  configured(options.tags, tags);
  // After the containers, whose blocks it captions.
  on(options.caption, caption);
  configured(options.mermaidPele, mermaidPele);
  configured(options.fileTree, fileTree);
  configured(options.prompt, prompt);
  configured(options.copyCode, copyCode);
  on(options.sectionize, sectionize);
  // Before autolink-headings, which links to the ids slug sets.
  configured(options.slug, slug);
  configured(options.autolinkHeadings, autolinkHeadings);
  configured(options.lightbox, lightbox);
  on(options.unwrapImages, unwrapImages);
  on(options.squeezeParagraphs, squeezeParagraphs);
};
