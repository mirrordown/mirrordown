import { expect, it, describe } from "vite-plus/test";
import { inlineSvgMarkup } from "../../packages/core/src";

const limits = {
  maxImageSize: Infinity,
  maxOccurrences: Infinity,
  maxTotalSize: Infinity,
  deduplication: true
};

// With `optimize: false` the file reaches the markup builder as written, so it can't assume SVGO's double quotes or attribute order.
describe("inline-svg deduplication of an unoptimized file", () => {
  it("reads single-quoted root attributes, so the reference keeps its size", () => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' width='8' height='8'><path d='M0 0h8v8z'/></svg>`;
    const [first, second] = inlineSvgMarkup(svg, [`a`, `b`], `x.svg`, limits)!;
    expect(first).toContain(`<symbol id="svg-sprite-`);
    expect(first).toContain(`viewBox="0 0 8 8"><path d='M0 0h8v8z'/></symbol>`);
    expect(second).toMatch(
      /^<svg viewBox="0 0 8 8" width="8" height="8" aria-label="b"><use href="#svg-sprite-[a-z0-9]+"><\/use><\/svg>$/
    );
  });

  // An empty `viewBox=""` is an error in SVG and disables scaling; leaving it out is the root's own state.
  it("leaves out a viewBox the root doesn't have", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" stroke-width="2"><path d="M0 0h8v8z"/></svg>`;
    const [first] = inlineSvgMarkup(svg, [``, ``], `x.svg`, limits)!;
    expect(first).not.toContain(`viewBox`);
    expect(first).not.toContain(` width=`);
    expect(first).toContain(`<svg stroke-width="2"><use`);
  });
});
