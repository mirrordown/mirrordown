import { defineConfig } from "vite-plus";

export default defineConfig({
  run: { tasks: { build: { command: "vp pack", cache: true } } },
  pack: {
    entry: ["src/index.ts", "src/github-alerts.css"],
    deps: { neverBundle: [] },
    dts: false,
    format: "cjs",
  },
});
