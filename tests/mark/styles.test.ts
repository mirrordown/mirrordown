import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { HIGHLIGHT_MARKERS } from "../../packages/core/src";

const packages = join(import.meta.dirname, "../../packages");
const read = (name: string): string =>
  readFileSync(join(packages, name, "src/mark.css"), "utf8");

const stylesheet = read("mdit-mark");
const code = stylesheet.replaceAll(/\/\*[\s\S]*?\*\//g, ``);

// The selector and body of every style rule: the text before each `{` that opens a block and is not an at-rule, and what the block holds.
const rules = [
  ...code.matchAll(/(?<=^|[;{}])\s*([^;{}@]+?)\s*\{([^{}]*)\}/g)
].map(([, selector = ``, body = ``]) => ({ selector, body }));
const bodyOf = (selector: string): string =>
  rules.find((rule) => rule.selector === selector)?.body ?? ``;

const variants = [
  ...new Set([...HIGHLIGHT_MARKERS.values()].map(({ name }) => name))
];

describe("mark stylesheet", () => {
  // The three packages ship the same file, so a page looks the same whichever engine rendered it.
  it.each(["remd-mark", "sat-mark"])(
    "%s ships the same stylesheet as mdit-mark",
    (name) => {
      expect(read(name)).toBe(stylesheet);
    }
  );

  // Every highlight with a variant is a pill, whatever its name; a plain highlight has no attribute and keeps the browser's own style. Beside the pill there is one rule per default variant, and nothing else.
  it("styles highlights with a variant, and no other", () => {
    expect(rules.map(({ selector }) => selector)).toStrictEqual([
      `mark[data-highlight]`,
      ...variants.map((name) => `mark[data-highlight="${name}"]`)
    ]);
  });

  // The pill is drawn from one colour, so a variant a site adds needs one declaration, and an inline block so the space a removed colour emoji leaves collapses.
  it("draws the pill from --markdown-mark-color, as an inline block", () => {
    const pill = bodyOf(`mark[data-highlight]`);
    expect(pill).toMatch(/display:\s*inline-block;/);
    expect(pill).toMatch(/background-color:\s*light-dark\(/);
    expect(pill).toMatch(/\bcolor:\s*light-dark\(/);
    expect(pill.match(/var\(--markdown-mark-color\)/g)).toHaveLength(4);
    expect(pill).not.toMatch(/--markdown-mark-(?!color\b)/);
  });

  // A variant the stylesheet does not know is grey, also inside a coloured highlight, and an invalid colour falls back to it: the colour is a registered colour that does not inherit.
  it("registers --markdown-mark-color as a colour that does not inherit", () => {
    expect(code).toMatch(
      /@property --markdown-mark-color \{\s*syntax: "<color>";\s*inherits: false;\s*initial-value: oklch\([\d.]+ 0 0\);\s*\}/
    );
  });

  // Each default can be overridden on its own, through a token named after it, and an invalid token falls back to that variant's default: the token is read into a registered colour whose initial value is the default.
  it.each(variants)(
    "%s sets the pill's colour from its own token, with its default as a fallback",
    (name) => {
      expect(code).toMatch(
        new RegExp(
          `@property --_mark-${name} \\{\\s*syntax: "<color>";\\s*inherits: false;\\s*initial-value: oklch\\([^)]+\\);\\s*\\}`
        )
      );
      const body = bodyOf(`mark[data-highlight="${name}"]`);
      expect(body).toContain(`--_mark-${name}: var(--markdown-mark-${name});`);
      expect(body).toContain(`--markdown-mark-color: var(--_mark-${name});`);
    }
  );
});
