import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: { command: "vp pack", cache: true },
      dev: { command: "vp pack --watch", cache: false }
    }
  },
  pack: {
    entry: ["src/index.ts", "src/client.ts"],
    copy: [{ from: "src/prompt.css" }],
    deps: { neverBundle: ["satteri"], onlyBundle: false },
    dts: true
  }
});
