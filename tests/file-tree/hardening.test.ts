import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { fileTreeIcon, parseFileTree } from "../../packages/core/src/file-tree";
import { fileTree } from "../../packages/mdit-file-tree/src";

// The icon tables are plain objects, and a file can be named after anything, including what every object inherits. Such a name used to find a function where an icon was expected, and the tree failed to render.
describe("file-tree: a file named after an object's own members is a file", () => {
  const plain = fileTreeIcon(`notes.xyz`, false);
  const names = [
    `constructor`,
    `toString`,
    `valueOf`,
    `hasOwnProperty`,
    `__proto__`,
    `a.constructor`,
    `a.__proto__`
  ];

  it.each(names)("gives %s the icon of an unknown file", (name) => {
    expect(fileTreeIcon(name, false)).toEqual(plain);
  });

  it.each(names)("gives %s that icon with custom tables as well", (name) => {
    const icons = { names: { Makefile: `<svg></svg>` }, extensions: {} };
    expect(fileTreeIcon(name, false, icons)).toEqual(plain);
  });

  it("renders a tree that holds them", () => {
    const md = new MarkdownIt().use(fileTree);
    const html = md.render("```filetree\nsrc/\n  constructor\n  toString\n```");
    expect(html).toContain(`constructor`);
    expect(html).toContain(`toString`);
  });
});

// A row is read with patterns that once started again from every character of a long run, so a line of a few tens of thousands of characters took seconds. The bound is far above what linear work takes and far below what that took.
describe("file-tree: a long line is read in time proportional to its length", () => {
  const timed = (source: string): number => {
    const started = performance.now();
    parseFileTree(source);
    return performance.now() - started;
  };

  it.each([
    [`without a tab`, `a`.repeat(80_000)],
    [`of spaces before a name`, `x${` `.repeat(80_000)}y`],
    [`of spaces before a comment`, `x${` `.repeat(80_000)}# note`]
  ])("a line %s", (_name, line) => {
    expect(timed(`src/\n  ${line}`)).toBeLessThan(1500);
  });
});

// The same rows must come out of the faster patterns.
describe("file-tree: rows read as before", () => {
  it("reads a comment, a status and a highlight, with any spacing between them", () => {
    expect(
      parseFileTree(`**a.ts**   [M]    # changed\nb.ts // plain\nc#d.ts`)
    ).toMatchObject([
      { name: `a.ts`, highlight: true, status: `modified`, comment: `changed` },
      { name: `b.ts`, comment: `plain` },
      { name: `c#d.ts`, comment: undefined }
    ]);
  });

  it("puts a name after a tab at the next multiple of four columns", () => {
    const [root] = parseFileTree(`src/\n\ta.ts\n  \tb.ts`);
    expect(root?.children.map((entry) => entry.name)).toEqual([`a.ts`, `b.ts`]);
  });
});
