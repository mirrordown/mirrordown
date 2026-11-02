import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeCopyCode } from "../../packages/remd-copy-code/src";
import { normalizeHtml } from "../utils/index.js";
import { fixture } from "./options.js";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeCopyCode)
  .use(rehypeStringify, { allowDangerousHtml: true });

describe("copy-code/remd", () => {
  it.each(fixture.cases())(
    "copy-code (remark): $name",
    ({ input, expected }) => {
      expect(normalizeHtml(String(processor.processSync(input)))).toBe(
        expected
      );
    }
  );
});
