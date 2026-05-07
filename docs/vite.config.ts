import { defineConfig } from "vite-plus";

export default defineConfig({
  run: { tasks: { build: { command: "vp exec astro build", cache: true } } },
});
