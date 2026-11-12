import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers
} from "../../packages/remd-github-alerts/src";
import { satteriGithubAlerts } from "../../packages/sat-github-alerts/src";
import { normalizeHtml } from "../utils/index.js";
import type { AlertOptions } from "../../packages/mdit-github-alerts/src";

const engines = {
  mdit: (src: string, options: AlertOptions) =>
    new MarkdownIt().use(githubAlerts, options).render(src),
  remd: (src: string, options: AlertOptions) =>
    String(
      unified()
        .use(remarkParse)
        .use(remarkGithubAlerts, options)
        .use(remarkRehype, { handlers: githubAlertsHastHandlers })
        .use(rehypeStringify)
        .processSync(src)
    ),
  sat: (src: string, options: AlertOptions) =>
    markdownToHtml(src, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriGithubAlerts(options)]
    }).html
};

// Every engine's output for one input, which the contract says is the same HTML.
const renderAll = (src: string, options: AlertOptions = {}): string[] =>
  Object.values(engines).map((render) =>
    normalizeHtml(render(src, { icons: false, ...options }))
  );

const inAll = (html: string): string[] => [html, html, html];

const alert = (title: string, rest: string, label = title): string =>
  `<div class="markdown-alert" data-alert="note"><p class="markdown-alert-title" aria-label="${label}">${title}</p>${rest}</div>`;

describe("github-alerts: keywords that name Object.prototype members", () => {
  // The alias table is a plain object, so an inherited member must never count as an alias: it resolved to a function, and building the title from it threw on plain input.
  it.each(["constructor", "toString", "hasOwnProperty", "valueOf"])(
    "leaves `[!%s]` a blockquote",
    (keyword) => {
      const html = `<blockquote><p>[!${keyword}]\nbody</p></blockquote>`;
      expect(renderAll(`> [!${keyword}]\n> body`)).toStrictEqual(inAll(html));
      expect(
        renderAll(`> [!${keyword}]\n> body`, { matchCaseInsensitive: false })
      ).toStrictEqual(inAll(html));
    }
  );

  it("leaves `[!__proto__]` a blockquote", () => {
    const [mdit, remd, sat] = renderAll("> [!\\_\\_proto\\_\\_]\n> body");
    expect(mdit).toContain("<blockquote>");
    expect(remd).toContain("<blockquote>");
    expect(sat).toContain("<blockquote>");
  });

  it("titles a custom type named like an inherited member from its keyword, with icons on", () => {
    const html = `<div class="markdown-alert" data-alert="constructor"><p class="markdown-alert-title" aria-label="Constructor">Constructor</p><p>body</p></div>`;
    expect(
      renderAll("> [!x]\n> body", {
        types: { x: "constructor" },
        icons: true
      })
    ).toStrictEqual(inAll(html));
  });
});

describe("github-alerts: `types` keys", () => {
  // Keywords are lowercased before the lookup, so a key written with capitals could never match.
  it("match in any case when matching is case-insensitive", () => {
    const [mdit, remd, sat] = renderAll("> [!Spoiler]\n> body", {
      types: { Spoiler: "spoiler" }
    });
    expect(mdit).toContain('data-alert="spoiler"');
    expect([remd, sat]).toStrictEqual([mdit, mdit]);
  });

  it("match exactly when matching is case-sensitive", () => {
    const options = {
      types: { Spoiler: "spoiler" },
      matchCaseInsensitive: false
    };
    expect(renderAll("> [!Spoiler]\n> body", options)[0]).toContain(
      'data-alert="spoiler"'
    );
    expect(renderAll("> [!spoiler]\n> body", options)).toStrictEqual(
      inAll("<blockquote><p>[!spoiler]\nbody</p></blockquote>")
    );
  });
});
