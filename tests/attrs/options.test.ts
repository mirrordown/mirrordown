import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { attrs } from "../../packages/mdit-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const mdit = (options: Parameters<typeof attrs>[1], src: string) =>
  normalizeHtml(new MarkdownIt().use(attrs, options).render(src));

// ── rule: false / rule: [] ─────────────────────────────────────────────────

test("rule false: no attrs applied", () => {
  expect(mdit({ rule: false }, "# Hello {.title}")).not.toContain('class="title"');
  expect(mdit({ rule: false }, "# Hello {.title}")).toContain("<h1>Hello {.title}</h1>");
});

test("rule empty array: no attrs applied", () => {
  expect(mdit({ rule: [] }, "# Hello {.title}")).not.toContain('class="title"');
});

test("rule true: all rules active", () => {
  expect(mdit({ rule: true }, "# Hello {.title}")).toContain('class="title"');
  expect(mdit({ rule: true }, "*em*{.foo}")).toContain('class="foo"');
});

// ── rule: array of names ───────────────────────────────────────────────────

test("rule array: only heading enabled", () => {
  expect(mdit({ rule: ["heading"] }, "# Hello {.title}")).toContain('class="title"');
  expect(mdit({ rule: ["heading"] }, "*em*{.foo}")).not.toContain('class="foo"');
});

test("rule array: only inline enabled", () => {
  expect(mdit({ rule: ["inline"] }, "*em*{.foo}")).toContain('class="foo"');
  expect(mdit({ rule: ["inline"] }, "# Hello {.title}")).not.toContain('class="title"');
});

test("rule array: fence + heading but not block", () => {
  const options: Parameters<typeof attrs>[1] = { rule: ["fence", "heading"] };
  expect(mdit(options, "```js {.hl}\ncode\n```")).toContain('class="hl');
  expect(mdit(options, "# H {.title}")).toContain('class="title"');
  expect(mdit(options, "Paragraph. {.intro}")).not.toContain('class="intro"');
});

test("rule array: unknown rule name ignored", () => {
  // @ts-expect-error intentionally invalid rule name
  expect(() => mdit({ rule: ["unknown"] }, "# Hello {.title}")).not.toThrow();
  // @ts-expect-error intentionally invalid rule name
  expect(mdit({ rule: ["unknown"] }, "# Hello {.title}")).not.toContain('class="title"');
});

// ── allowed: string list ───────────────────────────────────────────────────

test("allowed string: only class permitted", () => {
  expect(mdit({ allowed: ["class"] }, "# Hello {.title #main}")).toContain('class="title"');
  expect(mdit({ allowed: ["class"] }, "# Hello {.title #main}")).not.toContain('id="main"');
});

test("allowed string: only id permitted", () => {
  expect(mdit({ allowed: ["id"] }, "# Hello {.title #main}")).toContain('id="main"');
  expect(mdit({ allowed: ["id"] }, "# Hello {.title #main}")).not.toContain('class="title"');
});

test("allowed string: data-* key permitted", () => {
  expect(mdit({ allowed: ["data-x"] }, "# Hello {data-x=foo}")).toContain('data-x="foo"');
  expect(mdit({ allowed: ["data-x"] }, "# Hello {data-x=foo .bar}")).not.toContain('class="bar"');
});

// ── allowed: regex ─────────────────────────────────────────────────────────

test("allowed regex: data-* pattern", () => {
  const options = { allowed: [/^data-/] };
  expect(mdit(options, "# Hello {data-x=foo data-y=bar}")).toContain('data-x="foo"');
  expect(mdit(options, "# Hello {data-x=foo data-y=bar}")).toContain('data-y="bar"');
  expect(mdit(options, "# Hello {data-x=foo .cls}")).not.toContain('class="cls"');
});

test("allowed regex: class and id via regex", () => {
  const options = { allowed: [/^(class|id)$/] };
  expect(mdit(options, "# Hello {.foo #bar data-x=baz}")).toContain('class="foo"');
  expect(mdit(options, "# Hello {.foo #bar data-x=baz}")).toContain('id="bar"');
  expect(mdit(options, "# Hello {.foo #bar data-x=baz}")).not.toContain("data-x");
});

// ── custom delimiters ──────────────────────────────────────────────────────

test("custom delimiters: bracket style", () => {
  const options = { left: "[", right: "]" };
  expect(mdit(options, "# Hello [.title]")).toContain('class="title"');
  expect(mdit(options, "# Hello {.title}")).not.toContain('class="title"');
});

test("custom delimiters: curly braces still match with default", () => {
  expect(mdit({}, "# Hello {.title}")).toContain('class="title"');
});

test("custom delimiters: doubled rejected", () => {
  const options = { left: "[", right: "]" };
  // [[...]] is a doubled delimiter, should not be processed
  expect(mdit(options, "# Hello [[.title]]")).not.toContain('class="title"');
});

// ── attr syntax variants ───────────────────────────────────────────────────

test("dot notation: adds class", () => {
  expect(mdit({}, "# Hello {.foo}")).toContain('class="foo"');
});

test("hash notation: adds id", () => {
  expect(mdit({}, "# Hello {#my-id}")).toContain('id="my-id"');
});

test("key=value: adds data attribute", () => {
  expect(mdit({}, "# Hello {data-x=42}")).toContain('data-x="42"');
});

test("key=quoted value: adds attribute with spaces", () => {
  expect(mdit({}, '# Hello {title="My Heading"}')).toContain('title="My Heading"');
});

test("multiple attrs in one block", () => {
  const out = mdit({}, "# Hello {.foo #bar data-x=baz}");
  expect(out).toContain('class="foo"');
  expect(out).toContain('id="bar"');
  expect(out).toContain('data-x="baz"');
});

test("double dot: css-module class", () => {
  expect(mdit({}, "# Hello {..my-module}")).toContain('css-module="my-module"');
});
