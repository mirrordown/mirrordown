import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command:
          "vp pack && vp exec postcss src/prompt.css --output dist/prompt.css && vp exec vsce package --no-dependencies",
        cache: true
      }
    }
  },
  pack: [
    {
      entry: "src/index.ts",
      deps: {
        // tsdown <0.23 compatibility: resolve external dependency subpaths.
        // Remove to preserve subpath imports as written (the new default).
        // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
        resolveDepSubpath: true,
        alwaysBundle: [/^@mirrordown\//]
      },
      dts: false,
      format: "cjs"
    },
    {
      // The client script, run by the preview, so the copy buttons work there too.
      entry: "src/preview.ts",
      deps: {
        resolveDepSubpath: true,
        alwaysBundle: [/^@mirrordown\//]
      },
      dts: false,
      format: "iife"
    }
  ]
});
