import type { Features, PluginFactoryContext } from "satteri";
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
import { satteriLightbox, type LightboxPlugin } from "@mirrordown/sat-lightbox";
import { satteriMark, type MarkPlugin } from "@mirrordown/sat-mark";
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
  autolinkHeadings?: boolean | AutolinkHeadingsOptions;
  del?: boolean;
  githubAlerts?: boolean | AlertOptions;
  ins?: boolean;
  kbd?: boolean;
  lightbox?: boolean;
  mark?: boolean;
  /** Ruby's own options; its `features` are always the preset's. */
  ruby?: boolean | Omit<RubyOptions, `features`>;
  sectionize?: boolean;
  slug?: boolean | SlugOptions;
  spoiler?: boolean;
  squeezeParagraphs?: boolean;
  /** Sätteri's built-in `subscript` feature. */
  sub?: boolean;
  /** Sätteri's built-in `superscript` feature. */
  sup?: boolean;
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
    | Factory<DelPlugin>
    | Factory<GithubAlertsPlugin>
    | Factory<InsPlugin>
    | Factory<KbdPlugin>
    | Factory<MarkPlugin>
    | Factory<RubyPlugin>
    | Factory<SpoilerPlugin>
  >;
  hastPlugins: Array<
    | Factory<AutolinkHeadingsPlugin>
    | Factory<LightboxPlugin>
    | Factory<SectionizePlugin>
    | Factory<SlugPlugin>
    | Factory<SqueezeParagraphsPlugin>
    | Factory<UnwrapImagesPlugin>
  >;
}

/**
 * The Mirrordown suite for Sätteri. `features` sets `smartPunctuation: false` explicitly, because hosts such as Astro turn it on by default and it rewrites delimiters some plugins read; pass `features: { smartPunctuation: true }` to turn it back on.
 */
export const mirrordown = (
  options: MirrordownOptions = {}
): MirrordownPreset => {
  // `true` (or unset) uses the plugin's defaults.
  const settings = <O>(setting: boolean | O | undefined): O | undefined =>
    typeof setting === `boolean` ? undefined : setting;

  const features: Features = {
    gfm: options.gfm !== false,
    smartPunctuation: false,
    subscript: options.sub !== false,
    superscript: options.sup !== false,
    ...options.features
  };

  return {
    features,
    // Ruby first: it re-reads its blocks from source, which nodes built by other plugins don't have.
    mdastPlugins: [
      ...(options.ruby === false
        ? []
        : [satteriRuby({ ...settings(options.ruby), features })]),
      ...(options.del === false ? [] : [satteriDel()]),
      ...(options.githubAlerts === false
        ? []
        : [satteriGithubAlerts(settings(options.githubAlerts))]),
      ...(options.ins === false ? [] : [satteriIns()]),
      ...(options.kbd === false ? [] : [satteriKbd()]),
      ...(options.mark === false ? [] : [satteriMark()]),
      ...(options.spoiler === false ? [] : [satteriSpoiler()])
    ],
    // In plugin order: sectionize before slug and autolink-headings (they still find the nested headings), lightbox before unwrap-images (it drops the text its marker empties), squeeze-paragraphs last (it removes the residue of the others).
    hastPlugins: [
      ...(options.sectionize === false ? [] : [satteriSectionize()]),
      ...(options.slug === false ? [] : [satteriSlug(settings(options.slug))]),
      ...(options.autolinkHeadings === false
        ? []
        : [satteriAutolinkHeadings(settings(options.autolinkHeadings))]),
      ...(options.lightbox === false ? [] : [satteriLightbox()]),
      ...(options.unwrapImages === false ? [] : [satteriUnwrapImages()]),
      ...(options.squeezeParagraphs === false
        ? []
        : [satteriSqueezeParagraphs()])
    ]
  };
};
