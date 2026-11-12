// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference types="vite/client" />
import { describe, expect, it, vi } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { copyCode } from "../../packages/mdit-copy-code/src";
import css from "../../packages/mdit-copy-code/src/copy-code.css?inline";

// The copy button only works in a browser: the invoker command, the clipboard, the stylesheet that shows and places it. The clipboard is stubbed to record what's copied.
const copied: string[] = [];
Object.defineProperty(navigator, `clipboard`, {
  configurable: true,
  value: {
    writeText: (text: string): Promise<void> => {
      copied.push(text);
      return Promise.resolve();
    }
  }
});

const style = document.createElement(`style`);
style.textContent = css;
document.head.append(style);
document.body.innerHTML = new MarkdownIt()
  .use(copyCode)
  .render("```sh\nnpm test\n```\n\n```js\nconst a = 1;\nconst b = 2;\n```");

const [first, second] = [
  ...document.querySelectorAll<HTMLButtonElement>(`.markdown-copy-code`)
];
const shown = (element: Element): boolean =>
  getComputedStyle(element).display !== `none`;

describe(`copy-code client`, () => {
  // A page without the script must not offer a button that does nothing.
  it(`leaves the buttons hidden until the script loads`, () => {
    expect(first && shown(first)).toBe(false);
  });

  it(`shows the buttons once the script loads`, async () => {
    await import(`../../packages/mdit-copy-code/src/client`);
    expect(first && shown(first)).toBe(true);
  });

  // What a reader pastes is the code as written, not the newline markdown ends a block with.
  it(`copies its own block's text, without the newline ending it`, async () => {
    first?.click();
    second?.click();
    await Promise.resolve();
    expect(copied).toEqual([`npm test`, `const a = 1;\nconst b = 2;`]);
  });

  // As GitHub does: a check, and the copied text in a pill beside the button, which names it too.
  it(`shows that it copied, with a check, its copied text and a new label`, () => {
    expect(first?.hasAttribute(`data-copied`)).toBe(true);
    expect(first?.getAttribute(`aria-label`)).toBe(`Copied!`);
    const check = first?.querySelector(
      `.markdown-copy-code-icon[data-state="copied"]`
    );
    const copy = first?.querySelector(
      `.markdown-copy-code-icon[data-state="copy"]`
    );
    const text = first?.querySelector(
      `.markdown-copy-code-text[data-state="copied"]`
    );
    const tooltip = first?.querySelector(
      `.markdown-copy-code-text[data-state="copy"]`
    );
    if (!first || !check || !copy || !text || !tooltip)
      throw new Error(`missing parts`);
    // The "Copy code" tooltip gives way to the copied text.
    expect(shown(tooltip)).toBe(false);
    expect(shown(check)).toBe(true);
    expect(shown(copy)).toBe(false);
    expect(shown(text)).toBe(true);
    // Beside the button, toward the block's start, and level with it.
    const pill = text.getBoundingClientRect();
    const rect = first.getBoundingClientRect();
    expect(pill.right).toBeLessThanOrEqual(rect.left);
    expect(
      Math.abs(pill.top + pill.height / 2 - (rect.top + rect.height / 2))
    ).toBeLessThan(1);
  });

  // The name comes from the plugin's options, so the script must give back the one the button had, not a default.
  it(`gives back its own label once the copied state ends`, async () => {
    const pre = document.createElement(`div`);
    pre.innerHTML = new MarkdownIt()
      .use(copyCode, { text: { copy: `Copy`, copied: `Done` } })
      .render("```sh\nls\n```");
    document.body.append(pre);
    const button = pre.querySelector<HTMLButtonElement>(`.markdown-copy-code`);
    vi.useFakeTimers();
    button?.click();
    await vi.waitFor(() =>
      expect(button?.getAttribute(`aria-label`)).toBe(`Done`)
    );
    vi.advanceTimersByTime(2000);
    vi.useRealTimers();
    expect(button?.getAttribute(`aria-label`)).toBe(`Copy`);
    expect(button?.hasAttribute(`data-copied`)).toBe(false);
  });

  // A block's id is a hash, and nothing keeps another element of the page from having the same one: a heading whose slug spells it, or the same block in a second document on the page. `commandfor` then finds that element, the first with the id, and a reader who pressed a block's button must still get that block, not a heading's text.
  it(`copies its own block when an element before it has the block's id`, async () => {
    const pre = second?.closest(`pre`);
    if (!second || !pre) throw new Error(`missing block`);
    const heading = document.createElement(`h1`);
    heading.id = pre.id;
    heading.textContent = `Not the code`;
    document.body.prepend(heading);
    second.click();
    await Promise.resolve();
    heading.remove();
    expect(copied.at(-1)).toBe(`const a = 1;\nconst b = 2;`);
    expect(second.hasAttribute(`data-copied`)).toBe(true);
  });

  // Without a wrapper, anchor positioning is what puts each button on its own block.
  it(`sits in its own block's top corner`, () => {
    for (const button of [first, second]) {
      const pre = button?.parentElement;
      if (!button || !pre) throw new Error(`missing block`);
      const block = pre.getBoundingClientRect();
      const rect = button.getBoundingClientRect();
      expect(rect.top - block.top).toBeGreaterThanOrEqual(0);
      expect(rect.top - block.top).toBeLessThan(16);
      expect(block.right - rect.right).toBeGreaterThanOrEqual(0);
      expect(block.right - rect.right).toBeLessThan(16);
    }
  });
});
