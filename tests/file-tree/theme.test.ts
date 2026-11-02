import { describe, expect, it } from "vite-plus/test";
import { fileTreeThemeStyle } from "../../packages/core/src/file-tree";

describe("fileTreeThemeStyle", () => {
  // A theme that has only some colors sets only those, so the stylesheet's defaults fill in the rest, color by color.
  it("sets only the colors a theme has", () => {
    expect(
      fileTreeThemeStyle({
        type: `dark`,
        colors: { "editor.background": `#24292e` }
      })
    ).toBe(`color-scheme:dark;--markdown-file-tree-theme-background:#24292e`);
  });

  // Colors in any notation reach the tree: oklch() suits contrast work better than the hex VS Code's themes use.
  it("passes colors in any notation", () => {
    expect(
      fileTreeThemeStyle({
        colors: {
          "editor.background": `oklch(0.25 0.02 250)`,
          "editor.foreground": `color-mix(in oklch, white 90%, oklch(0.7 0.1 250 / 50%))`,
          "list.hoverBackground": `rebeccapurple`
        }
      })
    ).toBe(
      `--markdown-file-tree-theme-background:oklch(0.25 0.02 250);--markdown-file-tree-theme-foreground:color-mix(in oklch, white 90%, oklch(0.7 0.1 250 / 50%));--markdown-file-tree-theme-hover:rebeccapurple`
    );
  });

  // The values go into a style attribute: none may end its declaration and add declarations of its own, or leave a parenthesis open to swallow the ones after it.
  it("leaves out values that could escape their declaration", () => {
    const style = fileTreeThemeStyle({
      colors: {
        "editor.background": `red;background-image:url(https://example.com)`,
        "editor.foreground": `oklch(0.5 0.1 250`,
        "list.hoverBackground": `red) blue (`,
        "list.focusOutline": `"red"`
      },
      tokenColors: [{ scope: `comment`, settings: { foreground: `red}` } }]
    });
    expect(style).toBe(``);
  });

  // A broken key in a theme gives way to the next key that names the same color, as a missing one does.
  it("falls back to the next key when one can't be used", () => {
    expect(
      fileTreeThemeStyle({
        colors: { "list.focusOutline": `red;`, focusBorder: `#0366d6` }
      })
    ).toBe(`--markdown-file-tree-theme-focus:#0366d6`);
  });

  // A light and dark pair sets a color only when both themes have it, since light-dark() needs both.
  it("pairs the colors both themes have", () => {
    expect(
      fileTreeThemeStyle({
        light: {
          colors: { "editor.background": `#fff`, "editor.foreground": `#000` }
        },
        dark: { colors: { "editor.background": `#000` } }
      })
    ).toBe(`--markdown-file-tree-theme-background:light-dark(#fff, #000)`);
  });
});
