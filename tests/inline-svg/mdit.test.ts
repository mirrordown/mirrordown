import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { inlineSvg } from "@saeris/mdit-inline-svg";

const md = new MarkdownIt().use(inlineSvg);

test("inline-svg (markdown-it): inlines svg", () => {
  const actual = md.render(`![](./fixtures/test.svg)`, {
    currentDocument: import.meta.url,
  });
  const expected = `<p><svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg"></svg></p>\n`;
  expect(actual).toBe(expected);
});

test("inline-svg (markdown-it): passes through when no currentDocument", () => {
  const result = md.render(`![](./fixtures/test.svg)`);
  expect(result).toContain(`<img`);
  expect(result).not.toContain(`<svg`);
});

test("inline-svg (markdown-it): passes through external svg url", () => {
  const result = md.render(`![](https://example.com/image.svg)`, {
    currentDocument: import.meta.url,
  });
  expect(result).toContain(`<img`);
  expect(result).not.toContain(`<svg`);
});

test("inline-svg (markdown-it): passes through non-svg images", () => {
  const result = md.render(`![logo](./fixtures/logo.png)`, {
    currentDocument: import.meta.url,
  });
  expect(result).toContain(`<img`);
  expect(result).not.toContain(`<svg`);
});
