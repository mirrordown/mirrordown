import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import { mark } from "../../packages/mdit-mark/src";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers
} from "../../packages/remd-github-alerts/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { satteriGithubAlerts } from "../../packages/sat-github-alerts/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { normalizeHtml } from "../utils/index.js";

const mdit = (src: string): string =>
  normalizeHtml(
    new MarkdownIt().use(githubAlerts, { icons: false }).use(mark).render(src)
  );

const remd = (src: string): string =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGithubAlerts, { icons: false })
        .use(remarkMark)
        .use(remarkRehype, { handlers: githubAlertsHastHandlers })
        .use(rehypeStringify)
        .processSync(src)
    )
  );

const sat = (src: string): string =>
  normalizeHtml(
    markdownToHtml(src, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriGithubAlerts({ icons: false }), satteriMark()]
    }).html
  );

// An alert splits its first paragraph's text into a title and a body. A span plugin that runs afterwards tells an escaped `==` from a real one by the text's place in the source, so the pieces must say which of their characters were escaped: with the whole paragraph's position on each, an escape on the title line shifted the reading of the body.
describe("github-alerts + mark: escapes in an alert's first paragraph", () => {
  it.each([
    ["> [!NOTE] t \\==\n> ==a== \\==b== c", "<p><mark>a</mark> ==b== c</p>"],
    [
      "> [!NOTE] ==a== \\==b==\n> x \\==y== ==z==",
      "<p>x ==y== <mark>z</mark></p>"
    ],
    ["> [!NOTE]\n> a \\==b== ==c==", "<p>a ==b== <mark>c</mark></p>"]
  ])("keeps an escaped delimiter in the body literal: %j", (src, body) => {
    expect(mdit(src)).toContain(body);
    expect(remd(src)).toContain(body);
    expect(sat(src)).toContain(body);
  });
});
