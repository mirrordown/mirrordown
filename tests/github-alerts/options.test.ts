import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers,
} from "../../packages/remd-github-alerts/src";
import { normalizeHtml } from "../utils/index.js";
import type { AlertOptions } from "../../packages/mdit-github-alerts/src";

const mdit = (options: AlertOptions | undefined, src: string) =>
  normalizeHtml(new MarkdownIt().use(githubAlerts, options).render(src));

const remd = (options: AlertOptions | undefined, src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGithubAlerts, options)
        .use(remarkRehype, { handlers: githubAlertsHastHandlers })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(src),
    ),
  );

const note = "> [!NOTE]\n> Body text.\n";
const custom = "> [!CUSTOM]\n> Body text.\n";

// ── types ─────────────────────────────────────────────────────────────────────

test("types: custom type keyword resolves to canonical", () => {
  const opts: AlertOptions = { types: { custom: "custom" } };
  expect(mdit(opts, custom)).toContain('data-alert="custom"');
  expect(remd(opts, custom)).toContain('data-alert="custom"');
});

test("types: custom alias maps to existing canonical", () => {
  const opts: AlertOptions = { types: { mycustom: "note" } };
  const src = "> [!MYCUSTOM]\n> Body text.\n";
  expect(mdit(opts, src)).toContain('data-alert="note"');
  expect(remd(opts, src)).toContain('data-alert="note"');
});

test("types: built-in aliases still work alongside custom types", () => {
  const opts: AlertOptions = { types: { custom: "custom" } };
  expect(mdit(opts, note)).toContain('data-alert="note"');
  expect(remd(opts, note)).toContain('data-alert="note"');
});

test("types: custom type title auto-capitalised from keyword", () => {
  const opts: AlertOptions = { types: { custom: "custom" } };
  expect(mdit(opts, custom)).toContain("Custom");
  expect(remd(opts, custom)).toContain("Custom");
});

// ── titles ────────────────────────────────────────────────────────────────────

test("titles: overrides default title text", () => {
  const opts: AlertOptions = { titles: { note: "Hinweis" } };
  expect(mdit(opts, note)).toContain("Hinweis");
  expect(remd(opts, note)).toContain("Hinweis");
});

test("titles: override does not bleed into title element text", () => {
  const opts: AlertOptions = { titles: { note: "Hinweis" } };
  expect(mdit(opts, note)).not.toContain(">Note<");
  expect(remd(opts, note)).not.toContain(">Note<");
});

test("titles: override appears in aria-label", () => {
  const opts: AlertOptions = { titles: { note: "Hinweis" } };
  expect(mdit(opts, note)).toContain('aria-label="Hinweis"');
  expect(remd(opts, note)).toContain('aria-label="Hinweis"');
});

test("titles: untouched types keep their default title", () => {
  const opts: AlertOptions = { titles: { note: "Hinweis" } };
  const tip = "> [!TIP]\n> Body.\n";
  expect(mdit(opts, tip)).toContain("Tip");
  expect(remd(opts, tip)).toContain("Tip");
});

test("types + titles: custom type with explicit title override", () => {
  const opts = { types: { custom: "custom" }, titles: { custom: "Custom Alert" } } as never;
  expect(mdit(opts, custom)).toContain('data-alert="custom"');
  expect(mdit(opts, custom)).toContain("Custom Alert");
  expect(remd(opts, custom)).toContain('data-alert="custom"');
  expect(remd(opts, custom)).toContain("Custom Alert");
});

// ── matchCaseInsensitive ──────────────────────────────────────────────────────

test("matchCaseInsensitive false: exact-case keyword matches", () => {
  const opts: AlertOptions = { matchCaseInsensitive: false };
  const lower = "> [!note]\n> Body.\n";
  expect(mdit(opts, lower)).toContain('data-alert="note"');
  expect(remd(opts, lower)).toContain('data-alert="note"');
});

test("matchCaseInsensitive false: wrong-case keyword passes through", () => {
  const opts: AlertOptions = { matchCaseInsensitive: false };
  expect(mdit(opts, note)).toContain("<blockquote>");
  expect(mdit(opts, note)).not.toContain("data-alert");
  expect(remd(opts, note)).toContain("<blockquote>");
  expect(remd(opts, note)).not.toContain("data-alert");
});

// ── icons ─────────────────────────────────────────────────────────────────────

test("icons false: no svg in output", () => {
  const opts: AlertOptions = { icons: false };
  expect(mdit(opts, note)).not.toContain("<svg");
  expect(remd(opts, note)).not.toContain("<svg");
});

test("icons false: title text still present", () => {
  const opts: AlertOptions = { icons: false };
  expect(mdit(opts, note)).toContain("Note");
  expect(remd(opts, note)).toContain("Note");
});

test("icons true (default): svg present", () => {
  expect(mdit(undefined, note)).toContain("<svg");
  expect(remd(undefined, note)).toContain("<svg");
});

// ── containerClass ────────────────────────────────────────────────────────────

test("containerClass: custom class on container", () => {
  const opts: AlertOptions = { containerClass: "callout" };
  expect(mdit(opts, note)).toContain('class="callout"');
  expect(mdit(opts, note)).not.toContain("markdown-alert");
  expect(remd(opts, note)).toContain('class="callout"');
  expect(remd(opts, note)).not.toContain("markdown-alert");
});

test("containerClass: title element uses custom prefix", () => {
  const opts: AlertOptions = { containerClass: "callout" };
  expect(mdit(opts, note)).toContain('class="callout-title"');
  expect(remd(opts, note)).toContain('class="callout-title"');
});
