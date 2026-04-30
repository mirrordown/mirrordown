import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: "src/index.ts",
    deps: { neverBundle: ["unified", "rehype-parse", "svgo", "vfile"], onlyBundle: false },
    dts: true,
  },
});
