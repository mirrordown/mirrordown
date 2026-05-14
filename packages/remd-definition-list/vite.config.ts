import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: { command: "vp pack", cache: true },
      dev: { command: "vp pack --watch", cache: false },
    },
  },
  pack: {
    entry: "src/index.ts",
    deps: {
      neverBundle: ["unified", "mdast", "hast", "unist", "mdast-util-to-hast", "unist-builder"],
      onlyBundle: false,
    },
    dts: true,
  },
});
