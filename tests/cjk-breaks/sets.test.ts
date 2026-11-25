import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { engines } from "../presets/engines.js";
import { comparable } from "../utils/hostile.js";
import { normalizeHtml, parseFixture } from "../utils/index.js";
import { withLineEndings } from "./line-endings.js";

// The spans of the other sets are read through, and their containers hold paragraphs like any other: the cases that need those sets run through the presets, where every set is on and in the order the presets give them.
const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = withLineEndings(
  parseFixture(
    read("fixtures/cjk-breaks-sets.md"),
    read("expected/cjk-breaks-sets.html")
  )
);

describe.each(engines)("cjk-breaks with the other sets, in %s", (_, render) => {
  const preset = render();
  it.each(cases)("$name", ({ input, expected }) => {
    expect(normalizeHtml(comparable(preset(input)))).toBe(expected);
  });
});
