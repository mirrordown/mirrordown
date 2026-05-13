import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: { command: "vp pack", cache: true },
      dev: { command: "vp pack --watch", cache: false },
    },
  },
  pack: {
    entry: ["src/index.ts"],
    copy: [{ from: "src/tabs.css" }],
    deps: { neverBundle: ["markdown-it"] },
    dts: true,
  },
});
