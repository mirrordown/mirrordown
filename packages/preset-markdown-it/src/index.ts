import type MarkdownIt from "markdown-it";
import { abbr } from "@mirrordown/mdit-abbr";
import { attrs, type AttrsOptions } from "@mirrordown/mdit-attrs";
import {
  autolinkHeadings,
  type AutolinkHeadingsOptions
} from "@mirrordown/mdit-autolink-headings";
import { caption } from "@mirrordown/mdit-caption";
import { dl } from "@mirrordown/mdit-definition-list";
import { del } from "@mirrordown/mdit-del";
import {
  githubAlerts,
  type AlertOptions
} from "@mirrordown/mdit-github-alerts";
import { ins } from "@mirrordown/mdit-ins";
import { kbd } from "@mirrordown/mdit-kbd";
import { lightbox, type LightboxOptions } from "@mirrordown/mdit-lightbox";
import { mark } from "@mirrordown/mdit-mark";
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
import { unwrapImages } from "@mirrordown/mdit-unwrap-images";

/** Every feature is on by default: `false` turns one off, an options object configures it. */
export interface MirrordownOptions {
  abbr?: boolean;
  attrs?: boolean | AttrsOptions;
  autolinkHeadings?: boolean | AutolinkHeadingsOptions;
  caption?: boolean;
  definitionList?: boolean;
  del?: boolean;
  githubAlerts?: boolean | AlertOptions;
  ins?: boolean;
  kbd?: boolean;
  lightbox?: boolean | LightboxOptions;
  mark?: boolean;
  mermaidPele?: boolean | MermaidPeleOptions;
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

  on(options.abbr, abbr);
  // Before slug, so explicit `{#id}` attributes win.
  configured(options.attrs, attrs);
  on(options.definitionList, dl);
  on(options.del, del);
  configured(options.githubAlerts, githubAlerts);
  on(options.ins, ins);
  on(options.kbd, kbd);
  on(options.mark, mark);
  configured(options.ruby, ruby);
  configured(options.steps, steps);
  on(options.spoiler, spoiler);
  on(options.sub, sub);
  on(options.sup, sup);
  configured(options.tabs, tabs);
  // After the containers, whose blocks it captions.
  on(options.caption, caption);
  configured(options.mermaidPele, mermaidPele);
  on(options.sectionize, sectionize);
  // Before autolink-headings, which links to the ids slug sets.
  configured(options.slug, slug);
  configured(options.autolinkHeadings, autolinkHeadings);
  configured(options.lightbox, lightbox);
  on(options.unwrapImages, unwrapImages);
  on(options.squeezeParagraphs, squeezeParagraphs);
};
