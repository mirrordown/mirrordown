import { defineConfig } from "vite-plus";

export default defineConfig({
  run: { tasks: { build: { command: "vp pack", cache: true }, dev: { command: "vp pack --watch", cache: false } } },
  pack: {
    entry: "src/index.ts",
    deps: {
      neverBundle: ["unified", "mdast", "hast", "unist", "hast-util-whitespace"],
      onlyBundle: false,
    },
    dts: true,
  },
});
