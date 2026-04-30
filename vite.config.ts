import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { configDefaults, defineConfig } from "vite-plus";

const root = fileURLToPath(new URL(".", import.meta.url));
const packages = readdirSync(join(root, "packages"));

export default defineConfig({
  root: "docs",
  run: {
    tasks: {
      build: {
        command: "vp run -r build",
        cache: true,
      },
    },
  },
  fmt: {},
  lint: { ignorePatterns: ["templates/**"], options: { typeAware: true, typeCheck: true } },
  resolve: {
    alias: Object.fromEntries(
      packages.map((pkg) => [`@saeris/${pkg}`, join(root, "packages", pkg, "src", "index.ts")]),
    ),
  },
  test: {
    root,
    include: ["tests/**/*.test.ts"],
    exclude: [...configDefaults.exclude, "docs/**"],
  },
});
