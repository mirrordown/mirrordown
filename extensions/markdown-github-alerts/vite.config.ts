import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command:
          "vp pack && vp exec postcss src/github-alerts.css --output dist/github-alerts.css && vp exec vsce package --no-dependencies",
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
