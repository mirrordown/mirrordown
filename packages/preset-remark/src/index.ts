import type { Root as HastRoot } from "hast";
import type { Root as MdastRoot } from "mdast";
import type { Handler } from "mdast-util-to-hast";
import remarkGfm from "remark-gfm";
import type { Plugin } from "unified";
import { remarkAbbr } from "@mirrordown/remd-abbr";
import { remarkAttrs, type AttrsOptions } from "@mirrordown/remd-attrs";
import { remarkCaption } from "@mirrordown/remd-caption";
import {
  rehypeCopyCode,
  type CopyCodeOptions
} from "@mirrordown/remd-copy-code";
import {
  rehypeFileTree,
  type FileTreeOptions
} from "@mirrordown/remd-file-tree";
import {
  rehypePrompt,
  remarkPrompt,
  type PromptOptions
} from "@mirrordown/remd-prompt";
import {
  rehypeAutolinkHeadings,
  type AutolinkHeadingsOptions
} from "@mirrordown/remd-autolink-headings";
import {
  remarkDefinitionList,
  defListHastHandlers
} from "@mirrordown/remd-definition-list";
import { remarkDel } from "@mirrordown/remd-del";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers,
  type AlertOptions
} from "@mirrordown/remd-github-alerts";
import { remarkIns } from "@mirrordown/remd-ins";
import { remarkKbd } from "@mirrordown/remd-kbd";
import {
  rehypeLightbox,
  type LightboxOptions
} from "@mirrordown/remd-lightbox";
import { remarkMark } from "@mirrordown/remd-mark";
import {
  rehypeMermaidPele,
  type RehypeMermaidPeleOptions
} from "@mirrordown/remd-mermaid-pele";
import { remarkRuby, type RubyOptions } from "@mirrordown/remd-ruby";
import { rehypeSectionize } from "@mirrordown/remd-sectionize";
import { rehypeSlug, type SlugOptions } from "@mirrordown/remd-slug";
import { remarkSpoiler, spoilerHastHandlers } from "@mirrordown/remd-spoiler";
import { rehypeSqueezeParagraphs } from "@mirrordown/remd-squeeze-paragraphs";
import {
  remarkSteps,
  stepsHastHandlers,
  type StepsOptions
} from "@mirrordown/remd-steps";
import { remarkSub } from "@mirrordown/remd-sub";
import { remarkSup } from "@mirrordown/remd-sup";
import {
  remarkTabs,
  tabsHastHandlers,
  type TabsOptions
} from "@mirrordown/remd-tabs";
import {
  rehypeTabIcons,
  type TabIconsOptions
} from "@mirrordown/remd-tab-icons";
import { rehypeUnwrapImages } from "@mirrordown/remd-unwrap-images";

/** Every feature is on by default: `false` turns one off, an options object configures it. */
export interface MirrordownOptions {
  /** GitHub Flavored Markdown through `remark-gfm`, with single-tilde strikethrough off so `~sub~` is subscript. */
  gfm?: boolean;
  abbr?: boolean;
  attrs?: boolean | AttrsOptions;
  autolinkHeadings?: boolean | AutolinkHeadingsOptions;
  caption?: boolean;
  copyCode?: boolean | CopyCodeOptions;
  definitionList?: boolean;
  del?: boolean;
  fileTree?: boolean | FileTreeOptions;
  githubAlerts?: boolean | AlertOptions;
  ins?: boolean;
  kbd?: boolean;
  lightbox?: boolean | LightboxOptions;
  mark?: boolean;
  mermaidPele?: boolean | RehypeMermaidPeleOptions;
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
  tabIcons?: boolean | TabIconsOptions;
  unwrapImages?: boolean;
}

/**
 * A plugin, alone or with its options. Narrower than unified's `PluggableList` (no presets or processors), so the lists also fit processors that only take plugins, such as Astro's `unified()`.
 */
export type PluginEntry<Tree extends MdastRoot | HastRoot> =
  // `any[]` parameters, as in the hosts' own plugin types: each plugin takes its own options.
  // oxlint-disable-next-line typescript/no-explicit-any
  Plugin<any[], Tree> | [Plugin<any[], Tree>, unknown];

/**
 * The suite as unified pipeline pieces, in the shape Astro's `unified()` processor takes. `gfm` and `smartypants` are `false` for processors that add their own: GFM is already in `remarkPlugins`, configured for `~sub~`, and smart punctuation would rewrite the delimiters some plugins read.
 */
export interface MirrordownPreset {
  remarkPlugins: Array<PluginEntry<MdastRoot>>;
  rehypePlugins: Array<PluginEntry<HastRoot>>;
  remarkRehype: { handlers: Record<string, Handler> };
  gfm: false;
  smartypants: false;
}

/**
 * The full Mirrordown suite for remark and rehype. `inline-svg` is not included: it reads files from disk and runs asynchronously, so add `@mirrordown/remd-inline-svg` to `rehypePlugins` yourself where that fits.
 */
export const mirrordown = (
  options: MirrordownOptions = {}
): MirrordownPreset => {
  // A plugin with options: `true` (or unset) uses its defaults.
  const configured = <O extends object, T extends MdastRoot | HastRoot>(
    setting: boolean | O | undefined,
    plugin: Plugin<[O?], T>
  ): Array<PluginEntry<T>> =>
    setting === false
      ? []
      : setting === true || setting === undefined
        ? [plugin]
        : [[plugin, setting]];
  const on = <T extends MdastRoot | HastRoot>(
    setting: boolean | undefined,
    plugin: Plugin<[], T>
  ): Array<PluginEntry<T>> => (setting === false ? [] : [plugin]);
  const handlers = (
    setting: unknown,
    map: Record<string, Handler>
  ): Record<string, Handler> => (setting === false ? {} : map);

  const gfm: Array<PluginEntry<MdastRoot>> =
    options.gfm === false ? [] : [[remarkGfm, { singleTilde: false }]];

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
    remarkPlugins: [
      ...gfm,
      // First: the plugins after it see a prompt's preview as part of the page.
      ...on(options.prompt !== false, remarkPrompt),
      // Before abbr and the delimiter plugins: it rebuilds each ruby from its source text, so what an earlier plugin did inside the braces would be lost.
      ...configured(options.ruby, remarkRuby),
      ...on(options.definitionList, remarkDefinitionList),
      // Before del, ins, mark and spoiler: a key's brackets isolate the delimiters inside it, as in markdown-it.
      ...on(options.kbd, remarkKbd),
      ...on(options.del, remarkDel),
      ...on(options.ins, remarkIns),
      ...on(options.mark, remarkMark),
      ...configured(options.steps, remarkSteps),
      ...on(options.spoiler, remarkSpoiler),
      ...on(options.sub, remarkSub),
      ...on(options.sup, remarkSup),
      ...configured(options.tabs, remarkTabs),
      // After the inline plugins, whose output a title's `aria-label` is read from, and after steps and tabs, whose headers take the marker line directly under them as body text.
      ...configured(options.githubAlerts, remarkGithubAlerts),
      // Attrs last, as markdown-it applies them after parsing: step titles, tab labels and the other plugins' nodes exist by then.
      ...configured(options.attrs, remarkAttrs),
      // After the delimiter plugins, alerts and attrs, as markdown-it applies abbreviations once inline parsing is done: a term inside an attribute block or equal to an alert's keyword is theirs first. It reads a definition from its source, so what the earlier plugins made of a definition's line doesn't matter.
      ...on(options.abbr, remarkAbbr),
      // After attrs and the containers: attributes ending a caption go on its figure.
      ...on(options.caption, remarkCaption)
    ],
    rehypePlugins: [
      // First, so the plugins after it see the diagrams' <svg>.
      ...configured(options.mermaidPele, rehypeMermaidPele),
      ...configured(options.fileTree, rehypeFileTree),
      ...configured(options.prompt, rehypePrompt),
      // After mermaid-pele, file-tree and prompt: a diagram, a tree or a prompt is no longer a code block.
      ...configured(options.copyCode, rehypeCopyCode),
      ...configured(tabIconsSetting, rehypeTabIcons),
      ...on(options.sectionize, rehypeSectionize),
      ...configured(options.slug, rehypeSlug),
      ...configured(options.autolinkHeadings, rehypeAutolinkHeadings),
      ...configured(options.lightbox, rehypeLightbox),
      ...on(options.unwrapImages, rehypeUnwrapImages),
      ...on(options.squeezeParagraphs, rehypeSqueezeParagraphs)
    ],
    remarkRehype: {
      handlers: {
        ...handlers(options.definitionList, defListHastHandlers),
        ...handlers(options.githubAlerts, githubAlertsHastHandlers),
        ...handlers(options.steps, stepsHastHandlers),
        ...handlers(options.spoiler, spoilerHastHandlers),
        ...handlers(options.tabs, tabsHastHandlers)
      }
    },
    gfm: false,
    smartypants: false
  };
};
