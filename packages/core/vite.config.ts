import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: { command: "vp pack", cache: true },
      dev: { command: "vp pack --watch", cache: false }
    }
  },
  pack: {
    // The tab icons are their own entry, so only the tab-icons plugins load them.
    entry: { index: "src/index.ts", "tab-icons": "src/tab-icons/index.ts" },
    dts: true
  }
});
