import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command:
          "vp pack && vp exec postcss src/tabs.css --output dist/tabs.css && vp exec vsce package --no-dependencies",
        cache: true,
      },
    },
  },
  pack: {
    entry: ["src/index.ts"],
    deps: { neverBundle: [] },
    dts: false,
    format: "cjs",
  },
});
