import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: { command: "vp pack", cache: true },
      dev: { command: "vp pack --watch", cache: false }
    }
  },
  pack: {
    // The tab icons, file-tree icons and prompt service icons are their own entries, so only the plugins that use them load them.
    entry: {
      index: "src/index.ts",
      "tab-icons": "src/tab-icons/index.ts",
      "file-tree": "src/file-tree/index.ts",
      prompt: "src/prompt/index.ts"
    },
    dts: true
  }
});
