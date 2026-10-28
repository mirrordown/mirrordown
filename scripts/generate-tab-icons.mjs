#!/usr/bin/env node
// Generates packages/core/src/tab-icons/builtin.ts: the icons tab-icons ships, as SVG markup, so the plugins need no icon packages at runtime. The keyword and extension table is ported from vitepress-plugin-group-icons (MIT, © 2024-present Leo, https://github.com/yuyinws/vitepress-plugin-group-icons); the icons come from the Iconify sets @iconify-json/vscode-icons (MIT) and @iconify-json/logos (CC0). Rerun after changing the table or updating those packages:
//
//   node scripts/generate-tab-icons.mjs
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getIconData, iconToHTML, iconToSVG, replaceIDs } from "@iconify/utils";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const pair = (dark, light) => ({ dark, light });

// Keywords match a whole word of a label; keys with a `.` are file names and extensions.
const table = {
  // Package managers
  pnpm: pair(
    "vscode-icons:file-type-pnpm",
    "vscode-icons:file-type-light-pnpm"
  ),
  npm: "vscode-icons:file-type-npm",
  yarn: "vscode-icons:file-type-yarn",
  bun: "vscode-icons:file-type-bun",
  bunx: "vscode-icons:file-type-bun",
  deno: "vscode-icons:file-type-deno",
  // Frameworks
  vue: "vscode-icons:file-type-vue",
  svelte: "vscode-icons:file-type-svelte",
  angular: "vscode-icons:file-type-angular",
  react: "vscode-icons:file-type-reactjs",
  solid: "logos:solidjs-icon",
  marko: "vscode-icons:file-type-marko",
  next: pair(
    "vscode-icons:file-type-next",
    "vscode-icons:file-type-light-next"
  ),
  nuxt: "vscode-icons:file-type-nuxt",
  astro: pair(
    "vscode-icons:file-type-astro",
    "vscode-icons:file-type-light-astro"
  ),
  qwik: "logos:qwik-icon",
  ember: "vscode-icons:file-type-ember",
  // Tools
  vitest: pair(
    "vscode-icons:file-type-vitest",
    "vscode-icons:file-type-light-vitest"
  ),
  rollup: "vscode-icons:file-type-rollup",
  webpack: "vscode-icons:file-type-webpack",
  vite: pair(
    "vscode-icons:file-type-vite",
    "vscode-icons:file-type-light-vite"
  ),
  esbuild: "vscode-icons:file-type-esbuild",
  rolldown: pair(
    "vscode-icons:file-type-rolldown",
    "vscode-icons:file-type-light-rolldown"
  ),
  oxlint: pair(
    "vscode-icons:file-type-oxc",
    "vscode-icons:file-type-light-oxc"
  ),
  oxc: pair("vscode-icons:file-type-oxc", "vscode-icons:file-type-light-oxc"),
  oxfmt: pair("vscode-icons:file-type-oxc", "vscode-icons:file-type-light-oxc"),
  eslint: "vscode-icons:file-type-eslint",
  tailwind: "vscode-icons:file-type-tailwind",
  tailwindcss: "vscode-icons:file-type-tailwind",
  unocss: "vscode-icons:file-type-unocss",
  // Miscellaneous
  tsconfig: "vscode-icons:file-type-tsconfig",
  editorconfig: "vscode-icons:file-type-editorconfig",
  gitignore: "vscode-icons:file-type-git",
  gitattributes: "vscode-icons:file-type-git",
  vscode: "vscode-icons:file-type-vscode",
  prisma: pair(
    "vscode-icons:file-type-prisma",
    "vscode-icons:file-type-light-prisma"
  ),
  gradle: pair(
    "vscode-icons:file-type-gradle",
    "vscode-icons:file-type-light-gradle"
  ),
  // File names and extensions
  "package.json": "vscode-icons:file-type-node",
  "uno.config.ts": "vscode-icons:file-type-unocss",
  ".sass": "vscode-icons:file-type-sass",
  ".less": "vscode-icons:file-type-less",
  ".toml": pair(
    "vscode-icons:file-type-toml",
    "vscode-icons:file-type-light-toml"
  ),
  ".ini": pair(
    "vscode-icons:file-type-ini",
    "vscode-icons:file-type-light-ini"
  ),
  ".jsp": "vscode-icons:file-type-jsp",
  ".wasm": "vscode-icons:file-type-wasm",
  ".rs": pair(
    "vscode-icons:file-type-rust",
    "vscode-icons:file-type-light-rust"
  ),
  ".go": "vscode-icons:file-type-go",
  ".java": "vscode-icons:file-type-java",
  ".c": "vscode-icons:file-type-c",
  ".cpp": "vscode-icons:file-type-cpp",
  ".cs": "vscode-icons:file-type-csharp",
  ".dart": "vscode-icons:file-type-dartlang",
  ".sln": "vscode-icons:file-type-sln",
  ".kt": "vscode-icons:file-type-kotlin",
  ".groovy": "vscode-icons:file-type-groovy",
  ".scala": "vscode-icons:file-type-scala",
  ".swift": "vscode-icons:file-type-swift",
  ".lua": "vscode-icons:file-type-lua",
  ".r": "vscode-icons:file-type-r",
  ".rb": "vscode-icons:file-type-ruby",
  ".mts": "vscode-icons:file-type-typescript",
  ".cts": "vscode-icons:file-type-typescript",
  ".ts": "vscode-icons:file-type-typescript",
  ".tsx": "vscode-icons:file-type-typescript",
  ".mjs": pair("vscode-icons:file-type-js", "vscode-icons:file-type-light-js"),
  ".cjs": pair("vscode-icons:file-type-js", "vscode-icons:file-type-light-js"),
  ".json": pair(
    "vscode-icons:file-type-json",
    "vscode-icons:file-type-light-json"
  ),
  ".js": pair("vscode-icons:file-type-js", "vscode-icons:file-type-light-js"),
  ".jsx": pair("vscode-icons:file-type-js", "vscode-icons:file-type-light-js"),
  ".md": "vscode-icons:file-type-markdown",
  ".py": "vscode-icons:file-type-python",
  ".ico": "vscode-icons:file-type-favicon",
  ".html": "vscode-icons:file-type-html",
  ".css": "vscode-icons:file-type-css",
  ".scss": "vscode-icons:file-type-scss",
  ".yml": pair(
    "vscode-icons:file-type-yaml-official",
    "vscode-icons:file-type-light-yaml-official"
  ),
  ".yaml": pair(
    "vscode-icons:file-type-yaml-official",
    "vscode-icons:file-type-light-yaml-official"
  ),
  ".php": "vscode-icons:file-type-php3",
  ".gjs": "vscode-icons:file-type-glimmer",
  ".gts": "vscode-icons:file-type-glimmer",
  ".env": "vscode-icons:file-type-dotenv"
};

const sets = {
  "vscode-icons": require("@iconify-json/vscode-icons").icons,
  logos: require("@iconify-json/logos").icons
};

// An icon's SVG, sized by CSS (no width or height), with its ids prefixed by its name so two icons on a page can't share one.
const svgs = new Map();
const svgOf = (id) => {
  if (svgs.has(id)) return svgs.get(id).name;
  const [collection, name] = id.split(":");
  const data = getIconData(sets[collection], name);
  if (!data) throw new Error(`No icon ${id}`);
  const { attributes, body } = iconToSVG(data);
  const { width: _width, height: _height, ...rest } = attributes;
  const constName = `${collection}_${name}`
    .replace(/[^A-Za-z0-9]+/g, "_")
    .toUpperCase();
  const svg = iconToHTML(
    replaceIDs(body, `markdown-tab-icon-${collection}-${name}-`),
    rest
  );
  svgs.set(id, { name: constName, svg });
  return constName;
};

const entries = Object.entries(table).map(([key, icon]) => {
  const value =
    typeof icon === "string"
      ? svgOf(icon)
      : `{ light: ${svgOf(icon.light)}, dark: ${svgOf(icon.dark)} }`;
  return `  ${JSON.stringify(key)}: ${value}`;
});

const source = `// Generated by scripts/generate-tab-icons.mjs; don't edit. The keyword and extension table is ported from vitepress-plugin-group-icons (MIT, © 2024-present Leo); the icons are from @iconify-json/vscode-icons (MIT) and @iconify-json/logos (CC0).
import type { TabIcon } from "./types.js";

${[...svgs.values()]
  .map(({ name, svg }) => `const ${name} = ${JSON.stringify(svg)};`)
  .join("\n")}

/** The icons tab-icons ships, by keyword (a whole word of a label) or file name and extension (keys with a \`.\`). */
export const BUILTIN_TAB_ICONS: Record<string, TabIcon> = {
${entries.join(",\n")}
};
`;

writeFileSync(join(root, "packages/core/src/tab-icons/builtin.ts"), source);
console.log(`Wrote ${Object.keys(table).length} keywords, ${svgs.size} icons`);
