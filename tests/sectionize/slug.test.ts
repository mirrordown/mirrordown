import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { sectionize } from "../../packages/mdit-sectionize/src";
import { slug } from "../../packages/mdit-slug/src";
import { rehypeSectionize } from "../../packages/remd-sectionize/src";
import { rehypeSlug } from "../../packages/remd-slug/src";
import { normalizeHtml } from "../utils/index.js";

// Recommended ordering: sectionize wraps first, slug adds ids afterwards. The
// slug must land on the heading regardless of the section wrapper around it.
const md = new MarkdownIt().use(sectionize).use(slug);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeSectionize)
        .use(rehypeSlug)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

describe("sectionize + slug", () => {
  it("headings inside sections still receive slug ids", () => {
    const input = "# Getting Started\n\nintro\n\n## Install\n\nsteps";
    const expected =
      '<section data-depth="1"><h1 id="getting-started">Getting Started</h1><p>intro</p>' +
      '<section data-depth="2"><h2 id="install">Install</h2><p>steps</p></section></section>';
    expect(normalizeHtml(md.render(input))).toBe(expected);
    expect(remd(input)).toBe(expected);
  });
});
