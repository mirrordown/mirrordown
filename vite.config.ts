import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vite-plus";

const root = fileURLToPath(new URL(".", import.meta.url));

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
  fmt: { ignorePatterns: ["templates/**", "tests/**/fixtures/**", "tests/**/expected/**"] },
  lint: { ignorePatterns: ["templates/**"], options: { typeAware: true, typeCheck: true } },
  test: {
    root,
    include: ["tests/**/*.test.ts"],
    exclude: [...configDefaults.exclude, "docs/**"],
  },
});
