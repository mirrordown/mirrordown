// Vite's client ambient types declare the `?inline` and `?raw` import shapes this test uses.
// oxlint-disable-next-line typescript/triple-slash-reference -- Vite ambient client types
/// <reference types="vite/client" />
import { beforeAll, describe, expect, it } from "vite-plus/test";
import { page } from "vite-plus/test/browser";
import type { ScreenshotMatcherOptions } from "vite-plus/test/browser";
import css from "../../packages/mdit-mermaid-pele/src/mermaid-pele.css?inline";
// The diagrams as the plugins write them at build time. Rendering here instead would measure text with the browser's canvas, which Pele only does in a browser, and lay the diagrams out differently from a build.
import expected from "./expected/mermaid-pele-commonmark.html?raw";

const SNAP: ScreenshotMatcherOptions = {
  comparatorName: "pixelmatch",
  comparatorOptions: {
    // Absorb cross-platform sub-pixel anti-aliasing noise.
    allowedMismatchedPixelRatio: 0.02
  }
};

// `toMatchScreenshot` is on `expect.element()`, which vite-plus's `expect` types lack (see tests/spoiler/visual.browser.test.ts).
interface ScreenshotAssertion {
  toMatchScreenshot: (
    name: string,
    options?: ScreenshotMatcherOptions
  ) => Promise<void>;
}
const browserExpect = expect as unknown as {
  element: (el: HTMLElement) => ScreenshotAssertion;
};

const cases = new Map(
  expected
    .split(/<!-- @case: (.+?) -->/)
    .slice(1)
    .reduce<[string, string][]>((pairs, part, index, parts) => {
      if (index % 2 === 0) pairs.push([part, parts[index + 1] ?? ``]);
      return pairs;
    }, [])
);

const diagrams = [
  [`flowchart`, `accessibility: title and description`],
  [`sequence`, `ids: each diagram gets its own prefix`],
  [`types`, `types: state, class, pie and gantt`],
  [
    `escaping`,
    `escaping: markup characters are text, and <b> is SVG bold, not HTML`
  ]
] as const;

// The stylesheet derives Pele's colors from `Canvas` and `CanvasText`, so a stage's `color-scheme` is all that differs between the two themes.
const render = (html: string, scheme: `light` | `dark`): HTMLElement => {
  document.body.innerHTML = `<div id="stage" style="color-scheme:${scheme};background:Canvas;color:CanvasText;width:40rem;padding:1rem;font:16px/1.6 system-ui,sans-serif">${html}</div>`;
  return document.getElementById(`stage`)!;
};

describe(`mermaid-pele visual`, () => {
  beforeAll(async () => {
    // Room for the widest diagram and the tallest case (four diagrams).
    await page.viewport(720, 1500);
    const style = document.createElement(`style`);
    style.textContent = css;
    document.head.append(style);
  });

  describe.each([`light`, `dark`] as const)(`%s`, (scheme) => {
    it.each(diagrams)(`%s`, async (name, key) => {
      const stage = render(cases.get(key) ?? ``, scheme);
      await browserExpect
        .element(stage)
        .toMatchScreenshot(`${name}-${scheme}`, SNAP);
    });
  });
});
