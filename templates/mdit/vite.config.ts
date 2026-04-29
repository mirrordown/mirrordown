import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: "src/index.ts",
    external: ["markdown-it"],
    dts: true,
  },
});
