import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "vp pack && vp exec postcss src/tabs.css --output dist/tabs.css",
        cache: true,
      },
    },
  },
  pack: {
    entry: ["src/index.ts"],
    deps: { neverBundle: ["unified", "mdast", "hast", "unist"] },
    dts: true,
  },
});
