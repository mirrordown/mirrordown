import { expect, test } from "vite-plus/test";
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

test("github-alerts + attrs (markdown-it): heading with attrs alongside alert", () => {
  const input = "## Notes {.section}\n\n> [!NOTE]\n> Some note content.";
  expect(normalizeHtml(md.render(input))).toMatchSnapshot();
});

test("github-alerts + attrs (markdown-it): paragraph with attrs after alert", () => {
  const input = "> [!TIP]\n> A helpful tip.\n\nRead more. {.callout}";
  const result = normalizeHtml(md.render(input));
  expect(result).toContain('class="callout"');
  expect(result).toContain('data-alert="tip"');
});

test("github-alerts + attrs (markdown-it): alerts and attrs coexist", () => {
  const input = "> [!WARNING]\n> Be careful.\n\n> [!NOTE]\n> Just a note.";
  const result = normalizeHtml(md.render(input));
  expect(result).toContain('data-alert="warning"');
  expect(result).toContain('data-alert="note"');
});

test("github-alerts + attrs (remark): heading with attrs alongside alert", () => {
  const input = "## Notes {.section}\n\n> [!NOTE]\n> Some note content.";
  expect(remd(input)).toMatchSnapshot();
});

test("github-alerts + attrs (remark): paragraph with attrs after alert", () => {
  const input = "> [!TIP]\n> A helpful tip.\n\nRead more. {.callout}";
  const result = remd(input);
  expect(result).toContain('class="callout"');
  expect(result).toContain('data-alert="tip"');
});

test("github-alerts + attrs (remark): alerts and attrs coexist", () => {
  const input = "> [!WARNING]\n> Be careful.\n\n> [!NOTE]\n> Just a note.";
  const result = remd(input);
  expect(result).toContain('data-alert="warning"');
  expect(result).toContain('data-alert="note"');
});
