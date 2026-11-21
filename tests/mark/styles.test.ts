import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { HIGHLIGHT_MARKERS } from "../../packages/core/src";

const HIGHLIGHT_COLOURS = new Map(
  [...HIGHLIGHT_MARKERS]
    .filter(([, variant]) => !variant.keep)
    .map(([key, { name }]) => [key, name])
);

const packages = join(import.meta.dirname, "../../packages");
const read = (name: string): string =>
  readFileSync(join(packages, name, "src/mark.css"), "utf8");

const stylesheet = read("mdit-mark");

// The selector of every style rule: with the comments gone, the text before each `{` that opens a block and is not an at-rule.
const selectors = [
  ...stylesheet
    .replaceAll(/\/\*[\s\S]*?\*\//g, ``)
    .matchAll(/(?:^|[;{}])\s*([^;{}@]+?)\s*\{/g)
].map(([, selector]) => selector);

describe("mark stylesheet", () => {
  // The three packages ship the same file, so a page looks the same whichever engine rendered it.
  it.each(["remd-mark", "sat-mark"])(
    "%s ships the same stylesheet as mdit-mark",
    (name) => {
      expect(read(name)).toBe(stylesheet);
    }
  );

  // A plain highlight keeps the browser's own style, and so does one whose data-highlight an author wrote by hand with a value that is not a colour: the stylesheet styles the six colours and nothing else.
  it("styles only highlights with one of the six colours", () => {
    expect(selectors).toStrictEqual(
      [...new Set(HIGHLIGHT_COLOURS.values())].map(
        (colour) => `mark[data-highlight="${colour}"]`
      )
    );
  });

  // Each colour can be overridden on its own, through a token named after it.
  it.each([...new Set(HIGHLIGHT_COLOURS.values())])(
    "%s reads its own public token",
    (colour) => {
      expect(stylesheet).toContain(`var(--markdown-mark-${colour})`);
    }
  );
});
