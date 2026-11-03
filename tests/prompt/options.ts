import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCases, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string): string => readFileSync(join(dir, path), "utf8");

interface Fixture {
  expectedPath: string;
  inputs: ReturnType<typeof parseCases>;
  cases: () => ReturnType<typeof parseFixture>;
}

const fixture = (name: string): Fixture => ({
  expectedPath: join(dir, `expected/${name}.html`),
  inputs: parseCases(read(`fixtures/${name}.md`)),
  cases: () =>
    parseFixture(read(`fixtures/${name}.md`), read(`expected/${name}.html`))
});

/**
 * The fixtures, by the syntax the page renders a prompt's preview with: CommonMark, GFM, or raw HTML, which each engine renders as it renders the page (and whose baselines differ between engines with their defaults, so the presets' suite leaves them out). The markdown-it suite writes their expected HTML, which embeds the services' icons (`vp test -u` regenerates it after the markup or the icons change; review the diff), and the remark and Sätteri suites check theirs against it.
 */
export const fixtures = {
  commonmark: fixture(`prompt`),
  gfm: fixture(`prompt-gfm`),
  html: fixture(`prompt-html`)
};

export type Syntax = keyof typeof fixtures;
