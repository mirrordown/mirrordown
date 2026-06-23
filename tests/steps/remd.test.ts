import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import { parseCases, normalizeHtml } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseCases(read("fixtures/steps.md"));

const process = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkSteps)
        .use(remarkRehype, { handlers: stepsHastHandlers as never })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(src)
    )
  );

describe("steps/remd", () => {
  it.each(cases)("steps (remark): $name", ({ input }) => {
    expect(process(input)).toMatchSnapshot();
  });
});
