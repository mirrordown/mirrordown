import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import {
  createTabIconResolver,
  tabIconMarkup
} from "../../packages/core/src/tab-icons";
import { tabs } from "../../packages/mdit-tabs/src";
import { tabIcons } from "../../packages/mdit-tab-icons/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { rehypeTabIcons } from "../../packages/remd-tab-icons/src";
import { satteriTabIcons } from "../../packages/sat-tab-icons/src";

// The `icons` option takes SVG as people copy it from an icon set or a file, not only the double-quoted, explicitly closed shape the built-in icons have. Each `<svg>` must keep what sizes and draws it (`viewBox`, `xmlns`) and end where it ends, or the icon is the wrong size or swallows the label after it.
describe(`tab-icons: your SVG markup`, () => {
  it.each([
    [
      `keeps single-quoted attributes, which size the icon`,
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M0 0'/></svg>`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="markdown-tab-icon" aria-hidden="true"><path d='M0 0'/></svg>`
    ],
    [
      `escapes a double quote in a single-quoted value it requotes`,
      `<svg viewBox='0 0 1 1' data-x='say "hi"'></svg>`,
      `<svg viewBox="0 0 1 1" data-x="say &quot;hi&quot;" class="markdown-tab-icon" aria-hidden="true"></svg>`
    ],
    [
      `closes a self-closing <svg/>, so the label's text isn't read as its content`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"/>`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="markdown-tab-icon" aria-hidden="true"></svg>`
    ],
    [
      `reads a > inside an attribute value as part of the value`,
      `<svg viewBox="0 0 24 24" data-x="a>b"><path d="M0 0"/></svg>`,
      `<svg viewBox="0 0 24 24" data-x="a>b" class="markdown-tab-icon" aria-hidden="true"><path d="M0 0"/></svg>`
    ],
    [
      `adds to a class the markup already has`,
      `\n  <svg class="mine" viewBox="0 0 1 1"></svg>\n`,
      `<svg class="mine markdown-tab-icon" viewBox="0 0 1 1" aria-hidden="true"></svg>`
    ]
  ])(`%s`, (_, markup, expected) => {
    expect(tabIconMarkup(markup)).toBe(expected);
  });

  // Markup with another root can't take the icon's class and `aria-hidden`: it would render unsized and be announced. Refusing it when the plugin is created names the key at fault instead of leaving a broken label to be found in the page.
  describe(`whose root isn't <svg> is refused when the plugin is created`, () => {
    it.each([
      [`an XML declaration first`, `<?xml version="1.0"?><svg></svg>`],
      [`a comment first`, `<!-- cargo --><svg></svg>`],
      [`another element`, `<img src="cargo.png" alt="">`],
      [`a pair missing a variant`, { light: `<svg></svg>` }],
      [`not markup at all`, 42]
    ])(`%s`, (_, icon) => {
      const options = { icons: { cargo: icon as string } };
      expect(() => createTabIconResolver(options)).toThrow(/"cargo"/);
      expect(() => new MarkdownIt().use(tabs).use(tabIcons, options)).toThrow(
        TypeError
      );
      expect(() =>
        unified()
          .use(remarkParse)
          .use(remarkTabs)
          .use(remarkRehype, { handlers: tabsHastHandlers as never })
          .use(rehypeTabIcons, options)
          .use(rehypeStringify)
          .processSync(`% cargo\n> Body.`)
      ).toThrow(TypeError);
      expect(() => satteriTabIcons(options)).toThrow(TypeError);
    });
  });
});
