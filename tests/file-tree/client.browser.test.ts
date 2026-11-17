// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference types="vite/client" />
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";
import MarkdownIt from "markdown-it";
import { fileTree } from "../../packages/mdit-file-tree/src";
import css from "../../packages/mdit-file-tree/src/file-tree.css?inline";

// The tree's keyboard behavior and its colors' fallbacks only exist in a browser: the client script's ARIA tree, and how registered custom properties treat a value that isn't a color.
const style = document.createElement(`style`);
style.textContent = css;
document.head.append(style);

const render = (source: string): HTMLElement => {
  const host = document.createElement(`div`);
  host.innerHTML = new MarkdownIt().use(fileTree).render(source);
  document.body.append(host);
  const tree = host.querySelector<HTMLElement>(`.markdown-file-tree`);
  if (!tree) throw new Error(`no tree`);
  return tree;
};

const tree = render(
  "```filetree\nsrc/\n  lib/...\n    a.ts\n  index.ts\nREADME.md\nvite.config.ts\n```"
);
const names = (): string[] =>
  [...tree.querySelectorAll(`.markdown-file-tree-name`)].map(
    (name) => name.textContent
  );
const focusedName = (): string | undefined =>
  document.activeElement
    ?.querySelector(`.markdown-file-tree-name`)
    ?.textContent.trim();

describe(`file-tree client`, () => {
  // Without the script, the tree is plain lists and <details>: nothing may claim a role the page can't honor.
  it(`leaves the tree as lists until the script loads`, () => {
    expect(tree.hasAttribute(`role`)).toBe(false);
    expect(tree.querySelector(`[role="treeitem"]`)).toBe(null);
    expect(names()).toEqual([
      `src`,
      `lib`,
      `a.ts`,
      `index.ts`,
      `README.md`,
      `vite.config.ts`
    ]);
  });

  it(`makes the tree an ARIA tree with one tab stop`, async () => {
    await import(`../../packages/mdit-file-tree/src/client`);
    expect(tree.getAttribute(`role`)).toBe(`tree`);
    expect(tree.getAttribute(`aria-label`)).toBe(`Files`);
    const items = [...tree.querySelectorAll<HTMLElement>(`[role="treeitem"]`)];
    expect(items.filter((item) => item.tabIndex === 0)).toHaveLength(1);
    // A folder's item is its <details>, named by its row alone rather than its whole subtree.
    const src = items[0];
    expect(src?.tagName).toBe(`DETAILS`);
    expect(src?.getAttribute(`aria-label`)).toBe(`src`);
    expect(src?.getAttribute(`aria-expanded`)).toBe(`true`);
    expect(src?.parentElement?.getAttribute(`role`)).toBe(`none`);
  });

  // ↓ walks the rows a reader sees: a closed folder's contents are skipped.
  it(`moves down past a closed folder's contents`, async () => {
    tree.querySelector<HTMLElement>(`[role="treeitem"]`)?.focus();
    await userEvent.keyboard(`{ArrowDown}`);
    expect(focusedName()).toBe(`lib`);
    await userEvent.keyboard(`{ArrowDown}`);
    expect(focusedName()).toBe(`index.ts`);
  });

  it(`opens a closed folder with →, then moves into it`, async () => {
    await userEvent.keyboard(`{ArrowUp}`);
    expect(focusedName()).toBe(`lib`);
    await userEvent.keyboard(`{ArrowRight}`);
    expect(document.activeElement?.getAttribute(`aria-expanded`)).toBe(`true`);
    await userEvent.keyboard(`{ArrowRight}`);
    expect(focusedName()).toBe(`a.ts`);
  });

  it(`moves to the parent with ←, then closes it`, async () => {
    await userEvent.keyboard(`{ArrowLeft}`);
    expect(focusedName()).toBe(`lib`);
    await userEvent.keyboard(`{ArrowLeft}`);
    expect(document.activeElement?.getAttribute(`aria-expanded`)).toBe(`false`);
  });

  it(`jumps to the next row whose name starts with what's typed`, async () => {
    await userEvent.keyboard(`v`);
    expect(focusedName()).toBe(`vite.config.ts`);
    await userEvent.keyboard(`{Home}`);
    expect(focusedName()).toBe(`src`);
  });

  // A page can load the script twice: here from a second package, whose copy is a module of its own. A tree with two sets of listeners acts twice on one key: → on a closed folder would open it and move into it at once, and ↓ would skip a row.
  describe(`when the script is loaded a second time`, () => {
    const pressRightOnClosedFolder = async (
      target: HTMLElement
    ): Promise<void> => {
      const folder = target.querySelector<HTMLDetailsElement>(
        `details[role="treeitem"]:not([open])`
      );
      if (!folder) throw new Error(`no closed folder`);
      const name = folder.querySelector(`.markdown-file-tree-name`);
      folder.focus();
      await userEvent.keyboard(`{ArrowRight}`);
      expect(folder.open).toBe(true);
      expect(document.activeElement).toBe(folder);
      expect(focusedName()).toBe(name?.textContent.trim());
    };

    it(`one key press still acts once on a tree that was already upgraded`, async () => {
      await import(`../../packages/remd-file-tree/src/client`);
      await pressRightOnClosedFolder(tree);
      await userEvent.keyboard(`{ArrowDown}`);
      expect(focusedName()).toBe(`a.ts`);
    });

    // Both copies watch the page for new trees, so one added later is offered to each.
    it(`one key press acts once on a tree added afterwards`, async () => {
      const added = render("```filetree\nlib/...\n  a.ts\n  b.ts\nc.ts\n```");
      await expect.poll(() => added.getAttribute(`role`)).toBe(`tree`);
      await pressRightOnClosedFolder(added);
      await userEvent.keyboard(`{ArrowDown}`);
      expect(focusedName()).toBe(`a.ts`);
    });
  });
});

describe(`file-tree colors`, () => {
  const background = (element: HTMLElement): string =>
    getComputedStyle(element, `::after`).backgroundColor;
  const withStyle = (declarations: string): HTMLElement => {
    const other = render("```filetree\nsrc/\n  index.ts\n```");
    other.setAttribute(`style`, declarations);
    return other;
  };
  const fallback = background(render("```filetree\nindex.ts\n```"));

  it(`uses a token that is a color, in any notation`, () => {
    expect(
      background(
        withStyle(`--markdown-file-tree-background: oklch(0.3 0.1 150)`)
      )
    ).toBe(`oklch(0.3 0.1 150)`);
  });

  // With var() alone, a token that isn't a color would leave the tree without a background at all.
  it(`ignores a token that isn't a color, keeping the default`, () => {
    expect(fallback).not.toBe(`rgba(0, 0, 0, 0)`);
    expect(
      background(withStyle(`--markdown-file-tree-background: notacolor`))
    ).toBe(fallback);
  });

  it(`ignores a theme color that isn't a color, keeping the default`, () => {
    expect(
      background(
        withStyle(`--markdown-file-tree-theme-background: oklch(nope)`)
      )
    ).toBe(fallback);
  });

  // Setting one color leaves the others to the theme or the defaults.
  it(`keeps the other colors when only some are set`, () => {
    const other = withStyle(
      `--markdown-file-tree-theme-background: rgb(1, 2, 3); --markdown-file-tree-foreground: rgb(4, 5, 6)`
    );
    expect(background(other)).toBe(`rgb(1, 2, 3)`);
    expect(getComputedStyle(other.querySelector(`li`) ?? other).color).toBe(
      `rgb(4, 5, 6)`
    );
  });
});
