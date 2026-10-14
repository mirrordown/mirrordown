import type { Features, PluginFactoryContext } from "satteri";
import {
  satteriGithubAlerts,
  type AlertOptions,
  type GithubAlertsPlugin
} from "@mirrordown/sat-github-alerts";
import { satteriMark, type MarkPlugin } from "@mirrordown/sat-mark";
import {
  satteriSlug,
  type SlugOptions,
  type SlugPlugin
} from "@mirrordown/sat-slug";

/** Every feature is on by default: `false` turns one off, an options object configures it. */
export interface MirrordownOptions {
  /** GitHub Flavored Markdown: tables, strikethrough, task lists, autolink literals and footnotes. */
  gfm?: boolean;
  githubAlerts?: boolean | AlertOptions;
  mark?: boolean;
  slug?: boolean | SlugOptions;
  /** Sätteri's built-in `subscript` feature. */
  sub?: boolean;
  /** Sätteri's built-in `superscript` feature. */
  sup?: boolean;
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
  mdastPlugins: Array<Factory<GithubAlertsPlugin> | Factory<MarkPlugin>>;
  hastPlugins: Array<Factory<SlugPlugin>>;
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

  return {
    features: {
      gfm: options.gfm !== false,
      smartPunctuation: false,
      subscript: options.sub !== false,
      superscript: options.sup !== false,
      ...options.features
    },
    mdastPlugins: [
      ...(options.githubAlerts === false
        ? []
        : [satteriGithubAlerts(settings(options.githubAlerts))]),
      ...(options.mark === false ? [] : [satteriMark()])
    ],
    hastPlugins:
      options.slug === false ? [] : [satteriSlug(settings(options.slug))]
  };
};
