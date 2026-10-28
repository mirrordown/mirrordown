import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCases, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string): string => readFileSync(join(dir, path), "utf8");

/** Pele options every engine renders the fixtures with: Gantt charts mark "today", so it's fixed, at local midnight, since Gantt dates are local too (a UTC instant would move the marker with the time zone). */
export const options = { now: new Date(2026, 0, 8) };

/**
 * The fixtures, by name. The markdown-it suite writes each one's expected HTML (`vp test -u` regenerates it after a Pele update; review the diff), and the remark and Sätteri suites check theirs against it.
 */
export const fixtures = [`commonmark`, `gfm`].map((name) => {
  const input = `fixtures/mermaid-pele-${name}.md`;
  const expected = `expected/mermaid-pele-${name}.html`;
  return {
    name,
    gfm: name === `gfm`,
    expectedPath: join(dir, expected),
    inputs: parseCases(read(input)),
    cases: (): ReturnType<typeof parseFixture> =>
      parseFixture(read(input), read(expected))
  };
});
