import { expect, test, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import { attrs } from "../../packages/mdit-attrs/src";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers,
} from "../../packages/remd-github-alerts/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(githubAlerts).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGithubAlerts)
        .use(remarkAttrs)
        .use(remarkRehype, { handlers: githubAlertsHastHandlers })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(src),
    ),
  );

describe("github-alerts + attrs: heading with attrs alongside alert", () => {
  const input = "## Notes {.section}\n\n> [!NOTE]\n> Some note content.";

  test("markdown-it", () => expect(normalizeHtml(md.render(input))).toMatchSnapshot());
  test("remark", () => expect(remd(input)).toMatchSnapshot());
});

describe("github-alerts + attrs: paragraph with attrs after alert", () => {
  const input = "> [!TIP]\n> A helpful tip.\n\nRead more. {.callout}";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="callout"');
    expect(result).toContain('data-alert="tip"');
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="callout"');
    expect(result).toContain('data-alert="tip"');
  });
});

describe("github-alerts + attrs: alerts and attrs coexist", () => {
  const input = "> [!WARNING]\n> Be careful.\n\n> [!NOTE]\n> Just a note.";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('data-alert="warning"');
    expect(result).toContain('data-alert="note"');
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('data-alert="warning"');
    expect(result).toContain('data-alert="note"');
  });
});

describe("github-alerts + attrs: id on standalone paragraph after alert applies to container", () => {
  const input = "> [!NOTE]\n> Some note content.\n\n{#my-note}";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('id="my-note"');
    expect(result).toContain('data-alert="note"');
    // {#my-note} consumed — not rendered as a standalone paragraph
    expect(result).not.toContain('<p id="my-note"');
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('id="my-note"');
    expect(result).toContain('data-alert="note"');
    expect(result).not.toContain('<p id="my-note"');
  });
});

describe("github-alerts + attrs: class on standalone paragraph after alert applies to container", () => {
  const input = "> [!TIP]\n> A helpful tip.\n\n{.custom-alert}";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain("markdown-alert custom-alert");
    expect(result).toContain('data-alert="tip"');
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain("markdown-alert custom-alert");
    expect(result).toContain('data-alert="tip"');
  });
});
