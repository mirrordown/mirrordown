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
import { parseCases, normalizeHtml } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseCases(read("fixtures/github-alerts-commonmark.md"));
const mainCases = cases.filter(({ name }) => name !== "no icons");
const noIconsCase = cases.find(({ name }) => name === "no icons")!;

const processor = unified()
  .use(remarkParse)
  .use(remarkGithubAlerts)
  .use(remarkRehype, { handlers: githubAlertsHastHandlers })
  .use(rehypeStringify, { allowDangerousHtml: true });

const processorNoIcons = unified()
  .use(remarkParse)
  .use(remarkGithubAlerts, { icons: false })
  .use(remarkRehype, { handlers: githubAlertsHastHandlers })
  .use(rehypeStringify, { allowDangerousHtml: true });

describe("github-alerts/remd", () => {
  it.each(mainCases)("github-alerts (remark): $name", ({ input }) => {
    expect(
      normalizeHtml(String(processor.processSync(input)))
    ).toMatchSnapshot();
  });

  it("github-alerts (remark): no icons", () => {
    expect(
      normalizeHtml(String(processorNoIcons.processSync(noIconsCase.input)))
    ).toMatchSnapshot();
  });
});
