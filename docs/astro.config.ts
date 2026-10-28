import { defineConfig, fontProviders } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { mirrordown } from "@mirrordown/preset-satteri";
import { satteriInlineSvg } from "@mirrordown/sat-inline-svg";

// The Mirrordown suite on Sätteri, plus inline-svg, which the preset leaves out because it reads files.
const preset = mirrordown();

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
    processor: satteri({
      ...preset,
      hastPlugins: [...preset.hastPlugins, satteriInlineSvg()]
    })
  }
});
