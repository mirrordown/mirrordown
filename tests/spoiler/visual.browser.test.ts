// Vite's client ambient types declare the `?inline` and asset (`.jpg`) import
// shapes this test uses. Referencing the published `vite/client` types is the
// LSP-robust way to get them (the TS native-preview LSP is unreliable about
// hand-rolled ambient `declare module` files discovered via tsconfig globs).
// oxlint-disable-next-line typescript/triple-slash-reference -- Vite ambient client types
/// <reference types="vite/client" />
import { beforeAll, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";
import type { ScreenshotMatcherOptions } from "vite-plus/test/browser";
import MarkdownIt from "markdown-it";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { lightbox } from "../../packages/mdit-lightbox/src";
// The stylesheets are imported as text (?inline) and injected into <head>.
import spoilerCss from "../../packages/mdit-spoiler/src/spoiler.css?inline";
import lightboxCss from "../../packages/mdit-lightbox/src/lightbox.css?inline";
// A real docs sample photo, imported as a Vite asset URL so the browser runner
// serves it and the <img> actually loads (markdown-it also accepts the simple
// resolved path, unlike a long data-URI which its link parser rejects).
import photoUrl from "../../docs/public/guide/plugins/assets/sapling.jpg";

const md = new MarkdownIt({ html: true }).use(spoiler).use(lightbox);

const SNAP: ScreenshotMatcherOptions = {
  comparatorName: "pixelmatch",
  comparatorOptions: {
    // Absorb cross-platform sub-pixel anti-aliasing / blur rasterization noise.
    allowedMismatchedPixelRatio: 0.02
  }
};

// Workaround for a vite-plus type-export gap: `toMatchScreenshot` lives on the
// assertion returned by `expect.element()`, but `expect` is only importable from
// "vite-plus/test" (the NODE-mode ExpectStatic, which lacks `.element`), and
// "vite-plus/test/browser" — which should alias vitest/browser — doesn't
// re-export `expect` at all. So no import yields the browser-augmented `expect`.
// The runtime is correct (these APIs exist and work); only the types are wrong.
// Cast the imported `expect` once, here, to the browser shape we actually use.
interface ScreenshotAssertion {
  toMatchScreenshot: (
    name: string,
    options?: ScreenshotMatcherOptions
  ) => Promise<void>;
}
const browserExpect = expect as unknown as {
  element: (el: HTMLElement) => ScreenshotAssertion;
};
const screenshot = async (stage: HTMLElement, name: string): Promise<void> => {
  await browserExpect.element(stage).toMatchScreenshot(name, SNAP);
};

const waitForImages = async (stage: HTMLElement): Promise<void> => {
  await Promise.all(
    [...stage.querySelectorAll("img")].map(async (img) => {
      if (img.complete) return;
      await new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
    })
  );
};

const render = async (src: string, width = "24rem"): Promise<HTMLElement> => {
  document.body.innerHTML = `<div id="stage" style="width:${width};padding:1rem;background:#fff;font:16px/1.6 system-ui,sans-serif;color:#111">${md.render(src)}</div>`;
  const stage = document.getElementById("stage")!;
  // An unloaded <img> has zero size, collapsing the media spoiler's box.
  await waitForImages(stage);
  return stage;
};

const content = (stage: HTMLElement): HTMLElement =>
  stage.querySelector<HTMLElement>(".markdown-spoiler-content")!;

const reveal = (stage: HTMLElement): void => {
  stage.querySelector<HTMLInputElement>(".markdown-spoiler-toggle")!.checked =
    true;
};

const TEXT = "The killer was ||the butler|| all along.";
const IMG = `Behold ||![art](${photoUrl})|| here.`;
const LIGHTBOX = `Zoom ||!![art](${photoUrl})|| here.`;

beforeAll(() => {
  const style = document.createElement("style");
  // Constrain images to a realistic content width (host pages/VSCode preview do
  // this too) so the spoiler box is a sensible size and the pill is visible.
  style.textContent = `.markdown-spoiler-content img{max-width:220px;height:auto}\n${spoilerCss}\n${lightboxCss}`;
  document.head.appendChild(style);
});

describe("spoiler visual regression", () => {
  it("text: default bar", async () => {
    const stage = await render(TEXT);
    await screenshot(stage, "text-default");
  });

  it("text: multi-line wrapping (per-line bars)", async () => {
    const stage = await render(
      "Here is ||a long spoiler that wraps across several lines to prove the black bar redraws on each wrapped fragment rather than one stretched box|| end.",
      "20rem"
    );
    await screenshot(stage, "text-wrapping");
  });

  it("text: revealed", async () => {
    const stage = await render(TEXT);
    reveal(stage);
    await screenshot(stage, "text-revealed");
  });

  it("text: hover", async () => {
    const stage = await render(TEXT);
    await userEvent.hover(content(stage));
    await screenshot(stage, "text-hover");
  });

  it("text: focus ring", async () => {
    const stage = await render(TEXT);
    stage.querySelector<HTMLInputElement>(".markdown-spoiler-toggle")!.focus();
    await screenshot(stage, "text-focus");
  });

  it("image: blurred + SPOILER pill", async () => {
    const stage = await render(IMG);
    await screenshot(stage, "image-default");
  });

  it("image: hover (brighten + solid pill)", async () => {
    const stage = await render(IMG);
    await userEvent.hover(content(stage));
    await screenshot(stage, "image-hover");
  });

  it("image: revealed", async () => {
    const stage = await render(IMG);
    reveal(stage);
    await screenshot(stage, "image-revealed");
  });

  it("lightbox image: blurred spoiler", async () => {
    const stage = await render(LIGHTBOX);
    await screenshot(stage, "lightbox-default");
  });

  it("lightbox image: revealed (trigger visible)", async () => {
    const stage = await render(LIGHTBOX);
    reveal(stage);
    await screenshot(stage, "lightbox-revealed");
  });
});
