import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: { command: "vp pack", cache: true },
      dev: { command: "vp pack --watch", cache: false }
    }
  },
  pack: {
    entry: ["src/index.ts"],
    copy: [{ from: "src/spoiler.css" }],
    deps: { neverBundle: ["unified", "mdast", "hast", "unist"] },
    dts: true
  }
});
