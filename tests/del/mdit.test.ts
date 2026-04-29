import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { del } from "@saeris/mdit-del";
import { normalizeHtml } from "../utils/index.js";

const fixture = readFileSync(join(import.meta.dirname, "fixtures/del.md"), "utf8");
const expected = normalizeHtml(
  readFileSync(join(import.meta.dirname, "expected/del.html"), "utf8"),
);

const md = new MarkdownIt({ html: true }).use(del);

test("del (markdown-it)", () => {
  expect(normalizeHtml(md.render(fixture))).toBe(expected);
});
