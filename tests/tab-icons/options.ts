import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCases, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string): string => readFileSync(join(dir, path), "utf8");

/**
 * The fixtures. The markdown-it suite writes their expected HTML, which embeds the icons' SVGs (`vp test -u` regenerates it after the icons change; review the diff), and the remark and Sätteri suites check theirs against it.
 */
export const fixture = {
  expectedPath: join(dir, `expected/tab-icons.html`),
  inputs: parseCases(read(`fixtures/tab-icons.md`)),
  cases: (): ReturnType<typeof parseFixture> =>
    parseFixture(read(`fixtures/tab-icons.md`), read(`expected/tab-icons.html`))
};
