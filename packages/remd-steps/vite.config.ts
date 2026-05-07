import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "vp pack && vp exec postcss src/steps.css --output dist/steps.css",
        cache: true,
      },
    },
  },
  pack: {
    entry: ["src/index.ts"],
    deps: { neverBundle: ["unified"], onlyBundle: false },
    dts: true,
  },
});
