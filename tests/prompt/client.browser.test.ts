// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference types="vite/client" />
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { prompt } from "../../packages/mdit-prompt/src";
import css from "../../packages/mdit-prompt/src/prompt.css?inline";

// Copying, and the colors' fallbacks, only exist in a browser: the clipboard, the client script, and how registered custom properties treat a value that isn't a color. The clipboard is stubbed to record what's copied.
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

const render = (source: string): HTMLElement => {
  const host = document.createElement(`div`);
  host.innerHTML = new MarkdownIt().use(prompt).render(source);
  document.body.append(host);
  const element = host.querySelector<HTMLElement>(`.markdown-prompt`);
  if (!element) throw new Error(`no prompt`);
  return element;
};

const shown = (element: Element | null): boolean =>
  element !== null && getComputedStyle(element).display !== `none`;

const first = render(
  "```prompt gemini open\nRead the guide.\n\n- Run `npm test`\n```"
);
const button = first.querySelector<HTMLButtonElement>(`.markdown-prompt-copy`);
const link = first.querySelector<HTMLAnchorElement>(`a[data-service="gemini"]`);

describe(`prompt client`, () => {
  // A page without the script must not offer a button that does nothing.
  it(`leaves the copy button hidden until the script loads`, () => {
    expect(shown(button)).toBe(false);
  });

  it(`shows the copy button once the script loads`, async () => {
    await import(`../../packages/mdit-prompt/src/client`);
    expect(shown(button)).toBe(true);
  });

  // An icon alone doesn't say what a button does: its label shows as its tooltip.
  it(`shows each button's label as its tooltip`, () => {
    const tooltip = (element: Element | null): string =>
      element ? getComputedStyle(element, `::after`).content : ``;
    expect(tooltip(button)).toBe(`"Copy prompt"`);
    expect(tooltip(link)).toBe(`"Copy, then open Gemini"`);
  });

  // The preview shows the prompt rendered; the switch shows its markdown instead, never both.
  it(`shows one view at a time, the preview first`, () => {
    const preview = first.querySelector(`.markdown-prompt-preview`);
    const markdown = first.querySelector(`.markdown-prompt-body`);
    expect(preview?.querySelector(`li code`)?.textContent).toBe(`npm test`);
    expect([shown(preview), shown(markdown)]).toEqual([true, false]);
    first.querySelector<HTMLInputElement>(`[value="markdown"]`)?.click();
    expect([shown(preview), shown(markdown)]).toEqual([false, true]);
    first.querySelector<HTMLInputElement>(`[value="preview"]`)?.click();
  });

  // What a reader pastes is the prompt as written (its markdown, whichever view shows), not the newline a code block ends with.
  it(`copies the prompt as written, and says so`, async () => {
    button?.click();
    await expect
      .poll(() => copied.at(-1))
      .toBe(`Read the guide.\n\n- Run \`npm test\``);
    expect(button?.dataset.state).toBe(`copied`);
    expect(button?.getAttribute(`aria-label`)).toBe(`Copied prompt`);
    // The tooltip follows the label.
    expect(getComputedStyle(button ?? first, `::after`).content).toBe(
      `"Copied prompt"`
    );
  });

  // Invisible characters are marked with their code points where the reader can see them, but what's copied is still what the author wrote, so the AI gets the prompt the reader was warned about.
  it(`marks invisible characters, and copies them as written`, async () => {
    const zeroWidth = String.fromCodePoint(0x200b);
    const element = render("```prompt\nSay" + zeroWidth + " hi.\n```");
    const mark = element.querySelector(`.markdown-prompt-hidden`);
    expect(mark && getComputedStyle(mark, `::before`).content).toBe(`"U+200B"`);
    // It opens on the markdown, where the marks are.
    element.querySelector(`details`)?.setAttribute(`open`, ``);
    expect(shown(element.querySelector(`.markdown-prompt-body`))).toBe(true);
    expect(shown(element.querySelector(`.markdown-prompt-preview`))).toBe(
      false
    );
    element.querySelector<HTMLButtonElement>(`.markdown-prompt-copy`)?.click();
    await expect.poll(() => copied.at(-1)).toBe(`Say${zeroWidth} hi.`);
  });

  // A service that can't take the prompt opens for pasting: the prompt must be on the clipboard by then, and the reader told where to paste it.
  it(`copies the prompt when a service opens for pasting`, async () => {
    copied.length = 0;
    // The link would open Gemini; the test only needs the click.
    link?.addEventListener(`click`, (event) => event.preventDefault(), {
      once: true
    });
    link?.click();
    await expect
      .poll(() => copied)
      .toEqual([`Read the guide.\n\n- Run \`npm test\``]);
    await expect
      .poll(() => document.querySelector(`[aria-live="polite"]`)?.textContent)
      .toBe(`Copied prompt. Paste it into Gemini.`);
  });
});

describe(`prompt colors`, () => {
  const background = (element: HTMLElement): string =>
    getComputedStyle(element, `::after`).backgroundColor;
  const withStyle = (declarations: string): HTMLElement => {
    const element = render("```prompt\nHi.\n```");
    element.setAttribute(`style`, declarations);
    return element;
  };
  const fallback = background(render("```prompt\nDefault.\n```"));

  it(`uses a token that is a color, in any notation`, () => {
    expect(
      background(withStyle(`--markdown-prompt-background: oklch(0.3 0.1 150)`))
    ).toBe(`oklch(0.3 0.1 150)`);
  });

  // With var() alone, a token that isn't a color would leave the prompt without a background at all.
  it(`ignores a token that isn't a color, keeping the default`, () => {
    expect(fallback).not.toBe(`rgba(0, 0, 0, 0)`);
    expect(
      background(withStyle(`--markdown-prompt-background: notacolor`))
    ).toBe(fallback);
  });
});
