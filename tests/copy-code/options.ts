import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCases, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string): string => readFileSync(join(dir, path), "utf8");

/**
 * The fixtures. The markdown-it suite writes their expected HTML, which embeds the buttons' SVG icons (`vp test -u` regenerates it after the button changes; review the diff), and the remark and Sätteri suites check theirs against it.
 */
export const fixture = {
  expectedPath: join(dir, `expected/copy-code.html`),
  inputs: parseCases(read(`fixtures/copy-code.md`)),
  cases: (): ReturnType<typeof parseFixture> =>
    parseFixture(read(`fixtures/copy-code.md`), read(`expected/copy-code.html`))
};
