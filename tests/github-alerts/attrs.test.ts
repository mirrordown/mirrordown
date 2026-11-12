import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import { attrs } from "../../packages/mdit-attrs/src";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers
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
        .processSync(src)
    )
  );

describe("github-alerts + attrs: heading with attrs alongside alert", () => {
  const input = "## Notes {.section}\n\n> [!NOTE]\n> Some note content.";

  it("markdown-it and remark render identically", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('<h2 class="section">Notes</h2>');
    expect(result).toContain('data-alert="note"');
    expect(remd(input)).toBe(result);
  });
});

describe("github-alerts + attrs: paragraph with attrs after alert", () => {
  const input = "> [!TIP]\n> A helpful tip.\n\nRead more. {.callout}";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="callout"');
    expect(result).toContain('data-alert="tip"');
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="callout"');
    expect(result).toContain('data-alert="tip"');
  });
});

describe("github-alerts + attrs: alerts and attrs coexist", () => {
  const input = "> [!WARNING]\n> Be careful.\n\n> [!NOTE]\n> Just a note.";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('data-alert="warning"');
    expect(result).toContain('data-alert="note"');
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('data-alert="warning"');
    expect(result).toContain('data-alert="note"');
  });
});

describe("github-alerts + attrs: id on standalone paragraph after alert applies to container", () => {
  const input = "> [!NOTE]\n> Some note content.\n\n{#my-note}";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('id="my-note"');
    expect(result).toContain('data-alert="note"');
    // {#my-note} consumed — not rendered as a standalone paragraph
    expect(result).not.toContain('<p id="my-note"');
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain('id="my-note"');
    expect(result).toContain('data-alert="note"');
    expect(result).not.toContain('<p id="my-note"');
  });
});

describe("github-alerts + attrs: class on standalone paragraph after alert applies to container", () => {
  const input = "> [!TIP]\n> A helpful tip.\n\n{.custom-alert}";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain("markdown-alert custom-alert");
    expect(result).toContain('data-alert="tip"');
  });

  it("remark", () => {
    const result = remd(input);
    expect(result).toContain("markdown-alert custom-alert");
    expect(result).toContain('data-alert="tip"');
  });
});

// The title's class is the alert's own, whatever classes the container gains: it was derived from the container's `class` after attrs had added to it, which gave `markdown-alert foo-title` and lost the title its styles.
describe("github-alerts + attrs: classes on the container leave the title's class alone", () => {
  it.each(["> [!NOTE]\n> body\n\n{.foo #bar}", "> [!NOTE]+\n> body\n\n{.foo}"])(
    "markdown-it and remark render identically: %j",
    (input) => {
      const result = normalizeHtml(md.render(input));
      expect(result).toContain('class="markdown-alert foo"');
      expect(result).toContain('class="markdown-alert-title"');
      expect(remd(input)).toBe(result);
    }
  );
});

// A plugin that runs before alerts may have put attributes on the blockquote; turning it into an alert must add to them, not replace them.
describe("github-alerts + attrs: attributes already on the blockquote", () => {
  it("stay on the alert when remark-attrs runs first", () => {
    const html = normalizeHtml(
      String(
        unified()
          .use(remarkParse)
          .use(remarkAttrs)
          .use(remarkGithubAlerts, { icons: false })
          .use(remarkRehype, { handlers: githubAlertsHastHandlers })
          .use(rehypeStringify)
          .processSync("> [!NOTE]\n> body\n{.foo #bar}")
      )
    );
    expect(html).toBe(
      '<div class="markdown-alert foo" data-alert="note" id="bar"><p class="markdown-alert-title" aria-label="Note">Note</p><p>body</p></div>'
    );
  });
});
