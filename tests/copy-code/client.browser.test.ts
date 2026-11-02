// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference types="vite/client" />
import { describe, expect, it } from "vite-plus/test";
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

  it(`shows that it copied, with a check and a new label`, () => {
    expect(first?.hasAttribute(`data-copied`)).toBe(true);
    expect(first?.getAttribute(`aria-label`)).toBe(`Copied`);
    const check = first?.querySelector(`[data-icon="check"]`);
    const copy = first?.querySelector(`[data-icon="copy"]`);
    expect(check && shown(check)).toBe(true);
    expect(copy && shown(copy)).toBe(false);
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
