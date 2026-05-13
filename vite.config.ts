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
      dev: {
        command: "vp run --parallel --filter '@saeris/remd-*' --filter '@saeris/mdit-*' --filter '@saeris/markdown-docs' dev",
        cache: false,
      },
    },
  },
  fmt: {
    ignorePatterns: [
      "templates/**",
      "tests/**/fixtures/**",
      "tests/**/expected/**",
      "docs/public/plugins/**",
    ],
  },
  lint: { ignorePatterns: ["templates/**"], options: { typeAware: true, typeCheck: true } },
  test: {
    root,
    include: ["tests/**/*.test.ts"],
    exclude: [...configDefaults.exclude, "docs/**"],
  },
});
