import { defineConfig, fontProviders } from "astro/config";
import { remarkAbbr } from "@mirrordown/remd-abbr";
import { remarkAttrs } from "@mirrordown/remd-attrs";
import {
  remarkDefinitionList,
  defListHastHandlers
} from "@mirrordown/remd-definition-list";
import { remarkDel } from "@mirrordown/remd-del";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers
} from "@mirrordown/remd-github-alerts";
import { remarkIns } from "@mirrordown/remd-ins";
import { remarkKbd } from "@mirrordown/remd-kbd";
import { remarkMark } from "@mirrordown/remd-mark";
import { remarkRuby } from "@mirrordown/remd-ruby";
import { remarkSteps, stepsHastHandlers } from "@mirrordown/remd-steps";
import { remarkSub } from "@mirrordown/remd-sub";
import { remarkSup } from "@mirrordown/remd-sup";
import { remarkTabs, tabsHastHandlers } from "@mirrordown/remd-tabs";
import { rehypeSlug } from "@mirrordown/remd-slug";
import { rehypeAutolinkHeadings } from "@mirrordown/remd-autolink-headings";
import { rehypeInlineSvg } from "@mirrordown/remd-inline-svg";
import { rehypeLightbox } from "@mirrordown/remd-lightbox";
import { rehypeUnwrapImages } from "@mirrordown/remd-unwrap-images";

export default defineConfig({
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Mona Sans",
      cssVariable: "--font-mona-sans",
      weights: ["200 900"],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "-apple-system", "sans-serif"]
    },
    {
      provider: fontProviders.fontsource(),
      name: "Monaspace Neon",
      cssVariable: "--font-monaspace-neon",
      weights: [400, 600],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"]
    },
    {
      provider: fontProviders.fontsource(),
      name: "Monaspace Argon",
      cssVariable: "--font-monaspace-argon",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"]
    },
    {
      provider: fontProviders.fontsource(),
      name: "Monaspace Krypton",
      cssVariable: "--font-monaspace-krypton",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"]
    },
    {
      provider: fontProviders.fontsource(),
      name: "Monaspace Xenon",
      cssVariable: "--font-monaspace-xenon",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"]
    },
    {
      provider: fontProviders.fontsource(),
      name: "Monaspace Radon",
      cssVariable: "--font-monaspace-radon",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"]
    }
  ],
  integrations: [],
  markdown: {
    smartypants: false,
    remarkPlugins: [
      remarkAbbr,
      remarkAttrs,
      remarkDefinitionList,
      remarkDel,
      remarkGithubAlerts,
      remarkIns,
      remarkKbd,
      remarkMark,
      remarkRuby,
      remarkSteps,
      remarkSub,
      remarkSup,
      remarkTabs
    ],
    rehypePlugins: [
      rehypeSlug,
      rehypeAutolinkHeadings,
      rehypeLightbox,
      rehypeInlineSvg,
      rehypeUnwrapImages
    ],
    remarkRehype: {
      handlers: {
        ...defListHastHandlers,
        ...githubAlertsHastHandlers,
        ...stepsHastHandlers,
        ...tabsHastHandlers
      }
    }
  }
});
