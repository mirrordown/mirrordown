import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: { build: { command: "vp pack && vp exec vsce package --no-dependencies", cache: true } },
  },
  pack: {
    entry: "src/index.ts",
    deps: {
      neverBundle: [],
    },
    dts: false,
    format: "cjs",
  },
});
