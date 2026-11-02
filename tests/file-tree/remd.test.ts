import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeFileTree } from "../../packages/remd-file-tree/src";
import { normalizeHtml } from "../utils/index.js";
import { fixture } from "./options.js";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeFileTree)
  .use(rehypeStringify, { allowDangerousHtml: true });

describe("file-tree/remd", () => {
  it.each(fixture.cases())(
    "file-tree (remark): $name",
    ({ input, expected }) => {
      expect(normalizeHtml(String(processor.processSync(input)))).toBe(
        expected
      );
    }
  );
});
