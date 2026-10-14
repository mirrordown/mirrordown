import type { Root as HastRoot } from "hast";
import type { Root as MdastRoot } from "mdast";
import type { Handler } from "mdast-util-to-hast";
import remarkGfm from "remark-gfm";
import type { Plugin } from "unified";
import { remarkAbbr } from "@mirrordown/remd-abbr";
import { remarkAttrs, type AttrsOptions } from "@mirrordown/remd-attrs";
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
import { rehypeLightbox } from "@mirrordown/remd-lightbox";
import { remarkMark } from "@mirrordown/remd-mark";
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
import { rehypeUnwrapImages } from "@mirrordown/remd-unwrap-images";

/** Every feature is on by default: `false` turns one off, an options object configures it. */
export interface MirrordownOptions {
  /** GitHub Flavored Markdown through `remark-gfm`, with single-tilde strikethrough off so `~sub~` is subscript. */
  gfm?: boolean;
  abbr?: boolean;
  attrs?: boolean | AttrsOptions;
  autolinkHeadings?: boolean | AutolinkHeadingsOptions;
  definitionList?: boolean;
  del?: boolean;
  githubAlerts?: boolean | AlertOptions;
  ins?: boolean;
  kbd?: boolean;
  lightbox?: boolean;
  mark?: boolean;
  ruby?: boolean | RubyOptions;
  sectionize?: boolean;
  slug?: boolean | SlugOptions;
  spoiler?: boolean;
  squeezeParagraphs?: boolean;
  steps?: boolean | StepsOptions;
  sub?: boolean;
  sup?: boolean;
  tabs?: boolean | TabsOptions;
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

  return {
    remarkPlugins: [
      ...gfm,
      ...on(options.abbr, remarkAbbr),
      ...configured(options.attrs, remarkAttrs),
      ...on(options.definitionList, remarkDefinitionList),
      ...on(options.del, remarkDel),
      ...configured(options.githubAlerts, remarkGithubAlerts),
      ...on(options.ins, remarkIns),
      ...on(options.kbd, remarkKbd),
      ...on(options.mark, remarkMark),
      ...configured(options.ruby, remarkRuby),
      ...configured(options.steps, remarkSteps),
      ...on(options.spoiler, remarkSpoiler),
      ...on(options.sub, remarkSub),
      ...on(options.sup, remarkSup),
      ...configured(options.tabs, remarkTabs)
    ],
    rehypePlugins: [
      ...on(options.sectionize, rehypeSectionize),
      ...configured(options.slug, rehypeSlug),
      ...configured(options.autolinkHeadings, rehypeAutolinkHeadings),
      ...on(options.lightbox, rehypeLightbox),
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
