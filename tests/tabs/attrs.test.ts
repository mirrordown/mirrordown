import { expect, test, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { tabs } from "../../packages/mdit-tabs/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(tabs).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkTabs)
        .use(remarkAttrs)
        .use(remarkRehype, { handlers: tabsHastHandlers as never })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(src),
    ),
  );

describe("tabs + attrs: class on tab label applies to <label>", () => {
  // "% Tab One {.active}" → <label class="markdown-tabs-label active" ...>
  const input = "% Tab One {.active}\n> Content for tab one.\n% Tab Two\n> Content for tab two.";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs-label active"');
    expect(result).toContain('class="markdown-tabs-label"');
    expect(result).not.toContain("{.active}");
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs-label active"');
    expect(result).toContain('class="markdown-tabs-label"');
    expect(result).not.toContain("{.active}");
  });
});

describe("tabs + attrs: id on tab label applies to <label>", () => {
  const input = "% Tab One {#first-tab}\n> Content for tab one.\n% Tab Two\n> Content for tab two.";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('id="first-tab"');
    expect(result).toContain('class="markdown-tabs-label"');
    expect(result).not.toContain("{#first-tab}");
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('id="first-tab"');
    expect(result).toContain('class="markdown-tabs-label"');
    expect(result).not.toContain("{#first-tab}");
  });
});

describe("tabs + attrs: standalone attr paragraph after tab group applies to <div>", () => {
  // "{#install-tabs}" after closing → <div id="install-tabs" class="markdown-tabs">
  const input =
    "% npm\n> ```sh\n> npm install\n> ```\n% pnpm\n> ```sh\n> pnpm add\n> ```\n\n{#install-tabs}";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('id="install-tabs"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).not.toContain("<p>{#install-tabs}</p>");
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('id="install-tabs"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).not.toContain("<p>{#install-tabs}</p>");
  });
});

describe("tabs + attrs: class on standalone attr paragraph after tab group applies to <div>", () => {
  const input = "% Tab One\n> Content.\n% Tab Two\n> Content.\n\n{.highlighted}";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain("markdown-tabs highlighted");
    expect(result).not.toContain("<p>{.highlighted}</p>");
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain("markdown-tabs highlighted");
    expect(result).not.toContain("<p>{.highlighted}</p>");
  });
});

describe("tabs + attrs: attrs on heading before tab group do not bleed into container", () => {
  const input = "## Install {.section}\n\n% Tab One\n> Content.\n% Tab Two\n> Content.";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="section"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).not.toContain("markdown-tabs section");
    expect(result).not.toContain("{.section}");
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="section"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).not.toContain("markdown-tabs section");
    expect(result).not.toContain("{.section}");
  });
});

describe("tabs + attrs: attrs on paragraph after tab group do not apply to container", () => {
  const input = "% Tab One\n> Content.\n% Tab Two\n> Content.\n\nRead more. {.note}";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="note"');
    expect(result).not.toContain("markdown-tabs note");
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="note"');
    expect(result).not.toContain("markdown-tabs note");
  });
});

describe("tabs + attrs: multiple tab labels each with attrs", () => {
  const input = "% Tab One {.complete}\n> Body.\n% Tab Two {.active}\n> Body.";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs-label complete"');
    expect(result).toContain('class="markdown-tabs-label active"');
    expect(result).not.toContain("{.complete}");
    expect(result).not.toContain("{.active}");
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs-label complete"');
    expect(result).toContain('class="markdown-tabs-label active"');
    expect(result).not.toContain("{.complete}");
    expect(result).not.toContain("{.active}");
  });
});

describe("tabs + attrs: tabs and attrs coexist without interference", () => {
  const input =
    "Some *text*. {.intro}\n\n% Tab One\n> Content.\n% Tab Two\n> Content.\n\nAnother paragraph. {.outro}";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="intro"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="outro"');
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="intro"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="outro"');
  });
});
