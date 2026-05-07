import { defineConfig } from "vite-plus";

export default defineConfig({
  run: { tasks: { build: { command: "vp pack", cache: true } } },
  pack: {
    entry: ["src/index.ts", "src/steps.css"],
    deps: { neverBundle: ["markdown-it"] },
    dts: true,
  },
});
