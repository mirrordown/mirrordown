import { describe, expect, it } from "vite-plus/test";
import { mermaidSvg } from "../../packages/core/src/mermaid-pele";
import { tabIconMarkup } from "../../packages/core/src/tab-icons";

// `mermaidSvg` rewrites an `<svg>`'s opening tag to add attributes to it. Pele's own tags are always `name="value"` pairs, but tab icons pass markup people wrote through it too, and HTML allows more: an attribute it rewrote the tag without is an icon that lost its size, or a `hidden` sprite that shows.
describe(`core/mermaidSvg: attributes written as HTML allows`, () => {
  const added: [string, string][] = [[`class`, `x`]];

  it.each([
    [
      `keeps unquoted values, which size an icon copied from minified markup`,
      `<svg width=24 height=24 viewBox="0 0 1 1"></svg>`,
      `<svg width="24" height="24" viewBox="0 0 1 1" class="x"></svg>`
    ],
    [
      `keeps an attribute that has no value, written back with an empty one`,
      `<svg hidden viewBox='0 0 1 1'/>`,
      `<svg hidden="" viewBox="0 0 1 1" class="x"></svg>`
    ],
    [
      `keeps an attribute written right after another's closing quote`,
      `<svg data-a="1"data-b="2"></svg>`,
      `<svg data-a="1" data-b="2" class="x"></svg>`
    ],
    [
      `keeps a value written with spaces around its equals sign`,
      `<svg width = "24" height= 24></svg>`,
      `<svg width="24" height="24" class="x"></svg>`
    ],
    [
      `still replaces an attribute it was given, however the tag wrote it`,
      `<svg class=mine focusable></svg>`,
      `<svg class="mine x" focusable=""></svg>`
    ]
  ])(`%s`, (_, svg, expected) => {
    expect(mermaidSvg(svg, added)).toBe(expected);
  });

  it(`sizes a tab icon whose width and height are unquoted`, () => {
    expect(
      tabIconMarkup(`<svg width=24 height=24 viewBox="0 0 1 1"></svg>`)
    ).toBe(
      `<svg width="24" height="24" viewBox="0 0 1 1" class="markdown-tab-icon" aria-hidden="true"></svg>`
    );
  });
});
