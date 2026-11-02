import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: { command: "vp pack", cache: true },
      dev: { command: "vp pack --watch", cache: false }
    }
  },
  pack: {
    // The tab icons and file-tree icons are their own entries, so only the plugins that use them load them.
    entry: {
      index: "src/index.ts",
      "tab-icons": "src/tab-icons/index.ts",
      "file-tree": "src/file-tree/index.ts"
    },
    dts: true
  }
});
