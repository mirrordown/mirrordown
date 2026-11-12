import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers
} from "../../packages/remd-github-alerts/src";
import { satteriGithubAlerts } from "../../packages/sat-github-alerts/src";
import { normalizeHtml } from "../utils/index.js";
import type { AlertOptions } from "../../packages/mdit-github-alerts/src";

const engines = {
  mdit: (src: string, options: AlertOptions) =>
    new MarkdownIt().use(githubAlerts, options).render(src),
  remd: (src: string, options: AlertOptions) =>
    String(
      unified()
        .use(remarkParse)
        .use(remarkGithubAlerts, options)
        .use(remarkRehype, { handlers: githubAlertsHastHandlers })
        .use(rehypeStringify)
        .processSync(src)
    ),
  sat: (src: string, options: AlertOptions) =>
    markdownToHtml(src, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriGithubAlerts(options)]
    }).html
};

// Every engine's output for one input, which the contract says is the same HTML.
const renderAll = (src: string, options: AlertOptions = {}): string[] =>
  Object.values(engines).map((render) =>
    normalizeHtml(render(src, { icons: false, ...options }))
  );

const inAll = (html: string): string[] => [html, html, html];

const alert = (title: string, rest: string, label = title): string =>
  `<div class="markdown-alert" data-alert="note"><p class="markdown-alert-title" aria-label="${label}">${title}</p>${rest}</div>`;

describe("github-alerts: keywords that name Object.prototype members", () => {
  // The alias table is a plain object, so an inherited member must never count as an alias: it resolved to a function, and building the title from it threw on plain input.
  it.each(["constructor", "toString", "hasOwnProperty", "valueOf"])(
    "leaves `[!%s]` a blockquote",
    (keyword) => {
      const html = `<blockquote><p>[!${keyword}]\nbody</p></blockquote>`;
      expect(renderAll(`> [!${keyword}]\n> body`)).toStrictEqual(inAll(html));
      expect(
        renderAll(`> [!${keyword}]\n> body`, { matchCaseInsensitive: false })
      ).toStrictEqual(inAll(html));
    }
  );

  it("leaves `[!__proto__]` a blockquote", () => {
    const [mdit, remd, sat] = renderAll("> [!\\_\\_proto\\_\\_]\n> body");
    expect(mdit).toContain("<blockquote>");
    expect(remd).toContain("<blockquote>");
    expect(sat).toContain("<blockquote>");
  });

  it("titles a custom type named like an inherited member from its keyword, with icons on", () => {
    const html = `<div class="markdown-alert" data-alert="constructor"><p class="markdown-alert-title" aria-label="Constructor">Constructor</p><p>body</p></div>`;
    expect(
      renderAll("> [!x]\n> body", {
        types: { x: "constructor" },
        icons: true
      })
    ).toStrictEqual(inAll(html));
  });
});

describe("github-alerts: `types` keys", () => {
  // Keywords are lowercased before the lookup, so a key written with capitals could never match.
  it("match in any case when matching is case-insensitive", () => {
    const [mdit, remd, sat] = renderAll("> [!Spoiler]\n> body", {
      types: { Spoiler: "spoiler" }
    });
    expect(mdit).toContain('data-alert="spoiler"');
    expect([remd, sat]).toStrictEqual([mdit, mdit]);
  });

  it("match exactly when matching is case-sensitive", () => {
    const options = {
      types: { Spoiler: "spoiler" },
      matchCaseInsensitive: false
    };
    expect(renderAll("> [!Spoiler]\n> body", options)[0]).toContain(
      'data-alert="spoiler"'
    );
    expect(renderAll("> [!spoiler]\n> body", options)).toStrictEqual(
      inAll("<blockquote><p>[!spoiler]\nbody</p></blockquote>")
    );
  });
});

describe("github-alerts: only a paragraph opens an alert", () => {
  // markdown-it read the marker from whatever block came first in the quote, so a heading became an alert there and nowhere else.
  it.each([
    [
      "> # [!NOTE] Title\n> body",
      "<blockquote><h1>[!NOTE] Title</h1><p>body</p></blockquote>"
    ],
    ["> [!NOTE]\n> ===", "<blockquote><h1>[!NOTE]</h1></blockquote>"],
    [
      "> [!NOTE]\n> body\n> ---",
      "<blockquote><h2>[!NOTE]\nbody</h2></blockquote>"
    ]
  ])("keeps a heading that starts with a marker: %j", (src, html) => {
    expect(renderAll(src)).toStrictEqual(inAll(html));
  });
});

describe("github-alerts: a line break inside inline markup", () => {
  // The title ends at the first break outside inline markup. Cutting at one inside emphasis or a link split the element between the title and the body, which is not well-formed HTML.
  it.each([
    [
      "> [!NOTE] **bold\n> more** text",
      alert("<strong>bold\nmore</strong> text", "", "bold\nmore text")
    ],
    [
      "> [!NOTE] [link\n> text](http://x) end\n> body",
      alert(
        '<a href="http://x">link\ntext</a> end',
        "<p>body</p>",
        "link\ntext end"
      )
    ],
    [
      "> [!NOTE] **a  \n> b** c",
      alert("<strong>a<br>\nb</strong> c", "", "ab c")
    ]
  ])("stays in the title: %j", (src, html) => {
    expect(renderAll(src)).toStrictEqual(inAll(html));
  });
});

describe("github-alerts: escapes and character references on the marker line", () => {
  // An escaped character is the author saying "this is text", so it belongs in the label like any other text.
  it.each([
    ["> [!NOTE] AT\\&T rules\n> body", alert("AT&amp;T rules", "<p>body</p>")],
    [
      "> [!NOTE] Q&amp;A &copy; time\n> body",
      alert("Q&amp;A © time", "<p>body</p>")
    ],
    ["> [!NOTE] \\*\n> body", alert("*", "<p>body</p>")]
  ])("reads them into the title and its label: %j", (src, html) => {
    expect(renderAll(src)).toStrictEqual(inAll(html));
  });

  // And an escaped marker is not a marker: a backslash is how to write the text `[!NOTE]` at the start of a quote.
  it.each([
    "> \\[!NOTE]\n> body",
    "> &#91;!NOTE]\n> body",
    "> [\\!NOTE]\n> body",
    "> [!NOTE\\]\n> body"
  ])("leaves an escaped marker a blockquote: %j", (src) => {
    expect(renderAll(src)).toStrictEqual(
      inAll("<blockquote><p>[!NOTE]\nbody</p></blockquote>")
    );
  });

  it("reads an escaped fold marker as the title's first character", () => {
    expect(renderAll("> [!NOTE]\\+ plus\n> body")).toStrictEqual(
      inAll(alert("+ plus", "<p>body</p>"))
    );
  });
});

describe("github-alerts: a title with no plain text", () => {
  // The default title stands in for a missing title, not for one that has no text: the image was dropped from the document.
  it("keeps an image without alt text, labelled by the default title", () => {
    expect(renderAll("> [!NOTE] ![](x.png)\n> body")).toStrictEqual(
      inAll(alert('<img src="x.png" alt="">', "<p>body</p>", "Note"))
    );
  });
});

describe("github-alerts: line endings", () => {
  it.each(["\r", "\r\n", "\n"])(
    "ends the title at %j, as CommonMark ends a line",
    (eol) => {
      expect(renderAll(`> [!NOTE] Title${eol}> body${eol}`)).toStrictEqual(
        inAll(alert("Title", "<p>body</p>"))
      );
    }
  );
});

describe("github-alerts: remark without the hast handlers", () => {
  // The handlers only add the icon. Forgetting them must not lose the author's title, which used to live where only the handler could find it.
  it("still renders the title, without its icon", () => {
    const html = normalizeHtml(
      String(
        unified()
          .use(remarkParse)
          .use(remarkGithubAlerts)
          .use(remarkRehype)
          .use(rehypeStringify)
          .processSync("> [!NOTE]- Custom *title*\n> body")
      )
    );
    expect(html).toBe(
      '<details class="markdown-alert" data-alert="note"><summary class="markdown-alert-title" aria-label="Custom title">Custom <em>title</em></summary><p>body</p></details>'
    );
  });
});
