import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: { ignorePatterns: ["templates/**"], options: { typeAware: true, typeCheck: true } },
});
