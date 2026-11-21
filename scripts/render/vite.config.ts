import { defineConfig } from "vite-plus";

// The render tool's own test root: `scripts/render.mjs` runs `vp test run --root scripts/render`, so its one file is picked up here and never by the repository's suite.
export default defineConfig({
  test: { include: ["render.test.ts"], environment: "node" }
});
