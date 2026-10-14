import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers
} from "../../packages/remd-github-alerts/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/github-alerts-commonmark.md"),
  read("expected/github-alerts-commonmark.html")
);

const noIconsCases = parseFixture(
  read("fixtures/github-alerts-no-icons.md"),
  read("expected/github-alerts-no-icons.html")
);

// No `allowDangerousHtml`: icons must render in a default pipeline, as markdown-it's do with `html: false`.
const processor = (icons: boolean) =>
  unified()
    .use(remarkParse)
    .use(remarkGithubAlerts, { icons })
    .use(remarkRehype, { handlers: githubAlertsHastHandlers })
    .use(rehypeStringify);

const withIcons = processor(true);
const noIcons = processor(false);

describe("github-alerts/remd", () => {
  it.each(cmCases)("github-alerts (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(withIcons.processSync(input)))).toBe(expected);
  });

  it.each(noIconsCases)(
    "github-alerts (remark, icons: false): $name",
    ({ input, expected }) => {
      expect(normalizeHtml(String(noIcons.processSync(input)))).toBe(expected);
    }
  );
});
