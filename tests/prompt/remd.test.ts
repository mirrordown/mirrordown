import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypePrompt, remarkPrompt } from "../../packages/remd-prompt/src";
import { normalizeHtml } from "../utils/index.js";
import { fixtures, type Syntax } from "./options.js";

// The page's syntax is what a preview renders: GFM, or raw HTML, passed on as it is.
const processor = (syntax: Syntax) =>
  unified()
    .use(remarkParse)
    .use(syntax === `gfm` ? [remarkGfm] : [])
    .use(remarkPrompt)
    .use(remarkRehype, { allowDangerousHtml: syntax === `html` })
    .use(rehypePrompt)
    .use(rehypeStringify, { allowDangerousHtml: true });

describe.each(Object.keys(fixtures) as Syntax[])(
  "prompt/remd: %s",
  (syntax) => {
    const engine = processor(syntax);
    it.each(fixtures[syntax].cases())(
      "prompt (remark): $name",
      ({ input, expected }) => {
        expect(normalizeHtml(String(engine.processSync(input)))).toBe(expected);
      }
    );
  }
);
