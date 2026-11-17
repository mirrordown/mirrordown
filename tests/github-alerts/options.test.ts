import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { ICONS, githubAlerts } from "../../packages/mdit-github-alerts/src";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers
} from "../../packages/remd-github-alerts/src";
import { satteriGithubAlerts } from "../../packages/sat-github-alerts/src";
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
        .processSync(src)
    )
  );

const sat = (options: AlertOptions | undefined, src: string) =>
  normalizeHtml(
    markdownToHtml(src, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriGithubAlerts(options)]
    }).html
  );

// Every engine's output, which the contract says is the same HTML.
const all = (options: AlertOptions | undefined, src: string): string[] => [
  mdit(options, src),
  remd(options, src),
  sat(options, src)
];

const inAll = (html: string): string[] => [html, html, html];

const alertHtml = (type: string, title: string, extra = ""): string =>
  `<div class="markdown-alert" data-alert="${type}"${extra}><p class="markdown-alert-title" aria-label="${title}">${title}</p><p>Body text.</p></div>`;

const note = "> [!NOTE]\n> Body text.\n";
const custom = "> [!CUSTOM]\n> Body text.\n";

// â”€â”€ types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("github-alerts/options", () => {
  it("types: custom type keyword resolves to canonical", () => {
    const opts: AlertOptions = { types: { custom: "custom" } };
    expect(mdit(opts, custom)).toContain('data-alert="custom"');
    expect(remd(opts, custom)).toContain('data-alert="custom"');
  });

  it("types: custom alias maps to existing canonical", () => {
    const opts: AlertOptions = { types: { mycustom: "note" } };
    const src = "> [!MYCUSTOM]\n> Body text.\n";
    expect(mdit(opts, src)).toContain('data-alert="note"');
    expect(remd(opts, src)).toContain('data-alert="note"');
  });

  it("types: built-in aliases still work alongside custom types", () => {
    const opts: AlertOptions = { types: { custom: "custom" } };
    expect(mdit(opts, note)).toContain('data-alert="note"');
    expect(remd(opts, note)).toContain('data-alert="note"');
  });

  it("types: custom type title auto-capitalised from keyword", () => {
    const opts: AlertOptions = { types: { custom: "custom" } };
    expect(mdit(opts, custom)).toContain("Custom");
    expect(remd(opts, custom)).toContain("Custom");
  });

  // â”€â”€ titles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it("titles: overrides default title text", () => {
    const opts: AlertOptions = { titles: { note: "Hinweis" } };
    expect(mdit(opts, note)).toContain("Hinweis");
    expect(remd(opts, note)).toContain("Hinweis");
  });

  it("titles: override does not bleed into title element text", () => {
    const opts: AlertOptions = { titles: { note: "Hinweis" } };
    expect(mdit(opts, note)).not.toContain(">Note<");
    expect(remd(opts, note)).not.toContain(">Note<");
  });

  it("titles: override appears in aria-label", () => {
    const opts: AlertOptions = { titles: { note: "Hinweis" } };
    expect(mdit(opts, note)).toContain('aria-label="Hinweis"');
    expect(remd(opts, note)).toContain('aria-label="Hinweis"');
  });

  it("titles: untouched types keep their default title", () => {
    const opts: AlertOptions = { titles: { note: "Hinweis" } };
    const tip = "> [!TIP]\n> Body.\n";
    expect(mdit(opts, tip)).toContain("Tip");
    expect(remd(opts, tip)).toContain("Tip");
  });

  it("types + titles: custom type with explicit title override", () => {
    const opts = {
      types: { custom: "custom" },
      titles: { custom: "Custom Alert" }
    } as never;
    expect(mdit(opts, custom)).toContain('data-alert="custom"');
    expect(mdit(opts, custom)).toContain("Custom Alert");
    expect(remd(opts, custom)).toContain('data-alert="custom"');
    expect(remd(opts, custom)).toContain("Custom Alert");
  });

  // â”€â”€ matchCaseInsensitive â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it("matchCaseInsensitive false: exact-case keyword matches", () => {
    const opts: AlertOptions = { matchCaseInsensitive: false };
    const lower = "> [!note]\n> Body.\n";
    expect(mdit(opts, lower)).toContain('data-alert="note"');
    expect(remd(opts, lower)).toContain('data-alert="note"');
  });

  // With `fallback` on, the keyword would be an undefined type instead (see below).
  it("matchCaseInsensitive false: wrong-case keyword passes through", () => {
    const opts: AlertOptions = { matchCaseInsensitive: false, fallback: false };
    expect(mdit(opts, note)).toContain("<blockquote>");
    expect(mdit(opts, note)).not.toContain("data-alert");
    expect(remd(opts, note)).toContain("<blockquote>");
    expect(remd(opts, note)).not.toContain("data-alert");
  });

  // A keyword in the wrong case names no type, so it falls back like any undefined type, case kept: `[!NOTE]` is not a note, and does not take the note's colours.
  it("matchCaseInsensitive false: wrong-case built-in keyword is an undefined type", () => {
    const opts: AlertOptions = { matchCaseInsensitive: false, icons: false };
    expect(all(opts, note)).toStrictEqual(inAll(alertHtml("NOTE", "NOTE")));
  });

  it("matchCaseInsensitive false: an undefined type keeps its case", () => {
    const opts: AlertOptions = { matchCaseInsensitive: false, icons: false };
    expect(all(opts, "> [!Custom Type]\n> Body text.\n")).toStrictEqual(
      inAll(alertHtml("Custom-Type", "Custom Type"))
    );
  });

  // ── fallback ──

  it("fallback false: an undefined type stays a blockquote", () => {
    const opts: AlertOptions = { fallback: false };
    expect(all(opts, "> [!custom-type]\n> Body text.\n")).toStrictEqual(
      inAll("<blockquote><p>[!custom-type]\nBody text.</p></blockquote>")
    );
  });

  it("fallback false: built-in and registered types are still alerts", () => {
    const opts: AlertOptions = {
      fallback: false,
      icons: false,
      types: { release: "release" }
    };
    expect(all(opts, note)).toStrictEqual(inAll(alertHtml("note", "Note")));
    expect(all(opts, "> [!release]\n> Body text.\n")).toStrictEqual(
      inAll(alertHtml("release", "Release"))
    );
  });

  // A fallback type looks like a note, while a type `types` registers has no icon of its own, as before.
  it("icons: a fallback type takes the note icon, a registered type none", () => {
    const opts: AlertOptions = { types: { release: "release" } };
    const [fallback] = all(opts, "> [!custom-type]\n> Body text.\n");
    const [registered] = all(opts, "> [!release]\n> Body text.\n");
    expect(fallback).toContain(ICONS.note);
    expect(registered).not.toContain("<svg");
    expect(all(opts, "> [!custom-type]\n> Body text.\n")).toStrictEqual(
      inAll(fallback ?? "")
    );
  });

  // ── fallback titles ──

  it("titles: names a fallback type by its normalised identifier", () => {
    const opts: AlertOptions = {
      titles: { "custom-type": "My own" },
      icons: false
    };
    expect(all(opts, "> [!custom-type]\n> Body text.\n")).toStrictEqual(
      inAll(alertHtml("custom-type", "My own"))
    );
    expect(all(opts, "> [!Custom Type]\n> Body text.\n")).toStrictEqual(
      inAll(alertHtml("custom-type", "My own"))
    );
  });

  // Only a fallback type reads its dashes as spaces: a registered type keeps the title it had, the type capitalised. A fallback identifier that names a registered type is that type, title and all.
  it("types: a registered type keeps its capitalised title", () => {
    const opts: AlertOptions = { types: { x: "my-type" }, icons: false };
    expect(all(opts, "> [!x]\n> Body text.\n")).toStrictEqual(
      inAll(alertHtml("my-type", "My-type"))
    );
    expect(all(opts, "> [!my-type]\n> Body text.\n")).toStrictEqual(
      inAll(alertHtml("my-type", "My-type"))
    );
    expect(all(opts, "> [!other-type]\n> Body text.\n")).toStrictEqual(
      inAll(alertHtml("other-type", "Other type"))
    );
  });

  // ── types keys ──

  it("types: a key is normalised as a keyword is", () => {
    const opts: AlertOptions = {
      types: { " Release  Notes ": "release" },
      icons: false
    };
    expect(all(opts, "> [!release notes]\n> Body text.\n")).toStrictEqual(
      inAll(alertHtml("release", "Release"))
    );
    expect(all(opts, "> [!RELEASE-NOTES]\n> Body text.\n")).toStrictEqual(
      inAll(alertHtml("release", "Release"))
    );
  });

  // ── metadata ──

  it("metadata: on a registered type", () => {
    const opts: AlertOptions = { types: { release: "release" }, icons: false };
    expect(all(opts, "> [!release|wide]\n> Body text.\n")).toStrictEqual(
      inAll(alertHtml("release", "Release", ' data-alert-metadata="wide"'))
    );
    expect(all(opts, "> [!release|]\n> Body text.\n")).toStrictEqual(
      inAll(alertHtml("release", "Release"))
    );
  });

  // â”€â”€ icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it("icons false: no svg in output", () => {
    const opts: AlertOptions = { icons: false };
    expect(mdit(opts, note)).not.toContain("<svg");
    expect(remd(opts, note)).not.toContain("<svg");
  });

  it("icons false: title text still present", () => {
    const opts: AlertOptions = { icons: false };
    expect(mdit(opts, note)).toContain("Note");
    expect(remd(opts, note)).toContain("Note");
  });

  it("icons true (default): svg present", () => {
    expect(mdit(undefined, note)).toContain("<svg");
    expect(remd(undefined, note)).toContain("<svg");
  });

  // â”€â”€ containerClass â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it("containerClass: custom class on container", () => {
    const opts: AlertOptions = { containerClass: "callout" };
    expect(mdit(opts, note)).toContain('class="callout"');
    expect(mdit(opts, note)).not.toContain("markdown-alert");
    expect(remd(opts, note)).toContain('class="callout"');
    expect(remd(opts, note)).not.toContain("markdown-alert");
  });

  it("containerClass: title element uses custom prefix", () => {
    const opts: AlertOptions = { containerClass: "callout" };
    expect(mdit(opts, note)).toContain('class="callout-title"');
    expect(remd(opts, note)).toContain('class="callout-title"');
  });
});
