import { defineConfig, fontProviders } from "astro/config";
import { remarkAbbr } from "@saeris/remd-abbr";
import { remarkAttrs } from "@saeris/remd-attrs";
import { remarkDefinitionList, defListHastHandlers } from "@saeris/remd-definition-list";
import { remarkDel } from "@saeris/remd-del";
import { remarkGithubAlerts, githubAlertsHastHandlers } from "@saeris/remd-github-alerts";
import { remarkIns } from "@saeris/remd-ins";
import { remarkKbd } from "@saeris/remd-kbd";
import { remarkMark } from "@saeris/remd-mark";
import { remarkRuby } from "@saeris/remd-ruby";
import { remarkSteps, stepsHastHandlers } from "@saeris/remd-steps";
import { remarkSub } from "@saeris/remd-sub";
import { remarkSup } from "@saeris/remd-sup";
import { remarkTabs, tabsHastHandlers } from "@saeris/remd-tabs";
import { rehypeInlineSvg } from "@saeris/remd-inline-svg";
import { rehypeUnwrapImages } from "@saeris/remd-unwrap-images";

export default defineConfig({
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Mona Sans",
      cssVariable: "--font-mona-sans",
      weights: ["200 900"],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "-apple-system", "sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Monaspace Neon",
      cssVariable: "--font-monaspace-neon",
      weights: [400, 600],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Monaspace Argon",
      cssVariable: "--font-monaspace-argon",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Monaspace Krypton",
      cssVariable: "--font-monaspace-krypton",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Monaspace Xenon",
      cssVariable: "--font-monaspace-xenon",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Monaspace Radon",
      cssVariable: "--font-monaspace-radon",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"],
    },
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
      remarkTabs,
    ],
    rehypePlugins: [rehypeInlineSvg, rehypeUnwrapImages],
    remarkRehype: {
      handlers: {
        ...defListHastHandlers,
        ...githubAlertsHastHandlers,
        ...stepsHastHandlers,
        ...tabsHastHandlers,
      },
    },
  },
});
