import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { rehypeTabIcons } from "../../packages/remd-tab-icons/src";
import { normalizeHtml } from "../utils/index.js";
import { fixture } from "./options.js";

const processor = unified()
  .use(remarkParse)
  .use(remarkTabs)
  .use(remarkRehype, { handlers: tabsHastHandlers as never })
  .use(rehypeTabIcons)
  .use(rehypeStringify, { allowDangerousHtml: true });

describe("tab-icons/remd", () => {
  it.each(fixture.cases())(
    "tab-icons (remark): $name",
    ({ input, expected }) => {
      expect(normalizeHtml(String(processor.processSync(input)))).toBe(
        expected
      );
    }
  );
});
