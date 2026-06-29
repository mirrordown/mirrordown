import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command:
          "vp pack && vp exec postcss src/lightbox.css --output dist/lightbox.css && vp exec vsce package --no-dependencies",
        cache: true
      }
    }
  },
  pack: {
    entry: ["src/index.ts"],
    deps: { alwaysBundle: [/^@mirrordown\//] },
    dts: false,
    format: "cjs"
  }
});
