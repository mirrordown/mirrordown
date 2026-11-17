import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers
} from "../../packages/remd-github-alerts/src";
import { satteriGithubAlerts } from "../../packages/sat-github-alerts/src";
import {
  ICONS,
  createAlertResolver,
  isAlertMarkerLine,
  matchAlertMarker
} from "../../packages/core/src";
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
  // The alias table is a plain object, so an inherited member must never count as an alias: it resolved to a function, and building the title from it threw on plain input. Such a keyword is an undefined type like any other word, and falls back to an alert of its own.
  it.each([
    ["constructor", "constructor", "Constructor", "Constructor"],
    ["toString", "tostring", "Tostring", "ToString"],
    ["hasOwnProperty", "hasownproperty", "Hasownproperty", "HasOwnProperty"],
    ["valueOf", "valueof", "Valueof", "ValueOf"]
  ])("makes `[!%s]` a fallback alert", (keyword, type, title, exactTitle) => {
    const html = (type: string, title: string): string =>
      `<div class="markdown-alert" data-alert="${type}"><p class="markdown-alert-title" aria-label="${title}">${title}</p><p>body</p></div>`;
    const src = `> [!${keyword}]\n> body`;
    expect(renderAll(src)).toStrictEqual(inAll(html(type, title)));
    expect(renderAll(src, { matchCaseInsensitive: false })).toStrictEqual(
      inAll(html(keyword, exactTitle))
    );
    expect(renderAll(src, { fallback: false })).toStrictEqual(
      inAll(`<blockquote><p>[!${keyword}]\nbody</p></blockquote>`)
    );
  });

  // A document can't name `__proto__` as plain text: `__proto__` is strong emphasis in every engine, and an escaped marker is no marker. The resolver can still be handed it, and must not read the member every object inherits by that name.
  it("leaves `[!\\_\\_proto\\_\\_]` a blockquote", () => {
    const [mdit, remd, sat] = renderAll("> [!\\_\\_proto\\_\\_]\n> body");
    expect(mdit).toContain("<blockquote>");
    expect(remd).toContain("<blockquote>");
    expect(sat).toContain("<blockquote>");
  });

  it.each([
    ["__proto__", "__proto__"],
    ["constructor", "Constructor"],
    ["toString", "ToString"]
  ])(
    "resolves %s to a fallback type of that name, with its own title and the note icon",
    (keyword, title) => {
      const { resolve, titleFor, iconFor } = createAlertResolver({
        matchCaseInsensitive: false
      });
      expect(resolve(keyword)).toBe(keyword);
      expect(titleFor(keyword)).toBe(title);
      expect(iconFor(keyword)).toBe(ICONS.note);
    }
  );

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

  // With `fallback` on, `[!spoiler]` would be an alert of the undefined type `spoiler` instead, which looks the same.
  it("match exactly when matching is case-sensitive", () => {
    const options = {
      types: { Spoiler: "spoiler" },
      matchCaseInsensitive: false,
      fallback: false
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

describe("github-alerts: a default title with spaces around it", () => {
  // markdown-it and remark label a title by its text without the spaces around it, and Sätteri labelled a default title as the `titles` option gave it, so the engines disagreed.
  it("is labelled without them, in every engine", () => {
    expect(
      renderAll("> [!NOTE]\n> body", { titles: { note: " Hinweis " } })
    ).toStrictEqual(inAll(alert(" Hinweis ", "<p>body</p>", "Hinweis")));
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

describe("github-alerts: a title for a custom type", () => {
  // The guide's own example. `titles` is keyed by canonical type, and `types` adds canonical types, so the option's type has to take a name that is not built in: written as below, without a cast, this test is also what keeps the example compiling.
  it("gives each keyword of the custom type its title, in every engine", () => {
    const options: AlertOptions = {
      types: { release: "release", changelog: "release" },
      titles: { release: "Release notes", tip: "Pro tip" }
    };
    const html = (type: string, title: string): string =>
      `<div class="markdown-alert" data-alert="${type}"><p class="markdown-alert-title" aria-label="${title}">${title}</p><p>body</p></div>`;
    expect(renderAll("> [!RELEASE]\n> body", options)).toStrictEqual(
      inAll(html("release", "Release notes"))
    );
    expect(renderAll("> [!CHANGELOG]\n> body", options)).toStrictEqual(
      inAll(html("release", "Release notes"))
    );
    // A built-in type's title is still taken from the same map.
    expect(renderAll("> [!TIP]\n> body", options)).toStrictEqual(
      inAll(html("tip", "Pro tip"))
    );
  });
});

// An undefined type falls back to an alert of its own, and only when its identifier could be a `data-alert` value that reads the same in every engine.
describe("github-alerts: undefined types", () => {
  const quote = (text: string): string =>
    `<blockquote><p>${text}\nbody</p></blockquote>`;

  it.each(["a.b", 'x"y', "what?", "a/b", "my type.v2"])(
    "leaves `[!%s]` a blockquote: a character outside letters, numbers, `_` and `-`",
    (keyword) => {
      expect(renderAll(`> [!${keyword}]\n> body`)).toStrictEqual(
        inAll(quote(`[!${keyword}]`))
      );
    }
  );

  // markdown-it ends its text token at a line ending, so a marker that crossed one would be read in remark and Sätteri only.
  it.each([
    ["> [!my\n> type]\n> body", "[!my\ntype]"],
    ["> [!info|a\n> b]\n> body", "[!info|a\nb]"]
  ])("does not read a marker across a line ending: %j", (src, text) => {
    expect(renderAll(src)).toStrictEqual(inAll(quote(text)));
  });

  // The marker has to be plain text at the start of the quote's first paragraph, as for a built-in type.
  it.each([
    [
      "> `[!custom-type]`\n> body",
      "<blockquote><p><code>[!custom-type]</code>\nbody</p></blockquote>"
    ],
    [
      "> [[!custom-type]](http://x)\n> body",
      '<blockquote><p><a href="http://x">[!custom-type]</a>\nbody</p></blockquote>'
    ],
    [
      "> # [!custom-type]\n> body",
      "<blockquote><h1>[!custom-type]</h1><p>body</p></blockquote>"
    ],
    [
      "> - [!custom-type]\n> body",
      "<blockquote><ul><li>[!custom-type]\nbody</li></ul></blockquote>"
    ],
    [
      "> See [!custom-type] here\n> body",
      "<blockquote><p>See [!custom-type] here\nbody</p></blockquote>"
    ]
  ])("leaves a marker that is not plain text at the start: %j", (src, html) => {
    expect(renderAll(src)).toStrictEqual(inAll(html));
  });

  // A dash at either end of the identifier gives a default title with a space at that end, which the label leaves out in every engine. Visually the title reads the same.
  it.each([
    ["custom-", "Custom ", "Custom"],
    ["-custom", " custom", "custom"],
    ["-", " ", " "]
  ])("titles `[!%s]` %j, labelled %j", (keyword, title, label) => {
    expect(renderAll(`> [!${keyword}]\n> body`)).toStrictEqual(
      inAll(
        `<div class="markdown-alert" data-alert="${keyword}"><p class="markdown-alert-title" aria-label="${label}">${title}</p><p>body</p></div>`
      )
    );
  });

  it.each(["\r", "\r\n", "\n"])("ends the marker line at %j", (eol) => {
    expect(
      renderAll(`> [!custom-type|wide] Title${eol}> body${eol}`)
    ).toStrictEqual(
      inAll(
        '<div class="markdown-alert" data-alert="custom-type" data-alert-metadata="wide"><p class="markdown-alert-title" aria-label="Title">Title</p><p>body</p></div>'
      )
    );
  });
});

describe("github-alerts: metadata", () => {
  // Free text in an attribute: each engine escapes it in its own spelling, which the comparison unifies, and none leaves a raw `&` or `"`. A `$` pattern is text, not a replacement pattern.
  it.each([
    [
      '> [!info|a < b > c & "d" $& $$]\n> body',
      '<div class="markdown-alert" data-alert="info" data-alert-metadata="a < b > c &amp; &quot;d&quot; $&amp; $$"><p class="markdown-alert-title" aria-label="Info">Info</p><p>body</p></div>'
    ],
    [
      "> [!custom-type|R&D]- T\n> body",
      '<details class="markdown-alert" data-alert="custom-type" data-alert-metadata="R&amp;D"><summary class="markdown-alert-title" aria-label="T">T</summary><p>body</p></details>'
    ]
  ])("escapes it in its attribute: %j", (src, html) => {
    expect(renderAll(src)).toStrictEqual(inAll(html));
  });

  // An escaped character or a character reference anywhere in the brackets makes the marker text, as it does in the identifier: markdown-it splits the text there, so no engine could read on.
  it.each([
    ["> [!info\\|wide]\n> body", "[!info|wide]"],
    ["> [!info|a &amp; b]\n> body", "[!info|a &amp; b]"],
    ["> [!info|a\\]b]\n> body", "[!info|a]b]"],
    ["> [!custom\\-type|wide]\n> body", "[!custom-type|wide]"],
    ["> \\[!custom-type|wide]\n> body", "[!custom-type|wide]"],
    ["> &#91;!custom-type|wide]\n> body", "[!custom-type|wide]"]
  ])("leaves an escaped marker a blockquote: %j", (src, text) => {
    expect(renderAll(src)).toStrictEqual(
      inAll(`<blockquote><p>${text}\nbody</p></blockquote>`)
    );
  });

  it("reads an escaped fold marker after metadata as the title's first character", () => {
    expect(renderAll("> [!custom-type|wide]\\+ plus\n> body")).toStrictEqual(
      inAll(
        '<div class="markdown-alert" data-alert="custom-type" data-alert-metadata="wide"><p class="markdown-alert-title" aria-label="+ plus">+ plus</p><p>body</p></div>'
      )
    );
  });
});

describe("github-alerts: a marker in a GFM table cell", () => {
  // A cell holds no blockquote, so a marker there is only text.
  it("stays text", () => {
    const src = "| a |\n| - |\n| [!custom-type] |";
    const html = [
      new MarkdownIt().use(githubAlerts).render(src),
      String(
        unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkGithubAlerts)
          .use(remarkRehype, { handlers: githubAlertsHastHandlers })
          .use(rehypeStringify)
          .processSync(src)
      ),
      markdownToHtml(src, {
        features: { gfm: true, frontmatter: false, smartPunctuation: false },
        mdastPlugins: [satteriGithubAlerts()]
      }).html
    ].map(normalizeHtml);
    expect(html).toStrictEqual(
      inAll(
        "<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>[!custom-type]</td></tr></tbody></table>"
      )
    );
  });
});

// Steps, tabs and caption read a source line with `isAlertMarkerLine` to tell an alert's line, so it has to take every marker the plugins read.
describe("github-alerts: the marker grammar", () => {
  it("splits a marker into its identifier, metadata and fold", () => {
    expect(matchAlertMarker("[!My type| wide ]- Title")).toStrictEqual({
      length: 18,
      keyword: "My type",
      metadata: "wide",
      fold: "-"
    });
  });

  it.each([
    "> [!custom-type]",
    "> [!info|wide]+ Title",
    "> > [!重要|]",
    ">[!My type]"
  ])("knows %j for an alert's line", (line) => {
    expect(isAlertMarkerLine(line)).toBe(true);
  });

  it.each(["> [!|wide]", "> [!]", "> See [!info]"])(
    "knows %j is not one",
    (line) => {
      expect(isAlertMarkerLine(line)).toBe(false);
    }
  );

  // A pattern that started again from every character of a long run would take seconds here. The bound is far above what linear work takes and far below that.
  it.each([
    ["an identifier", `[!${"a".repeat(50_000)}`],
    ["metadata", `[!a|${"b".repeat(50_000)}`],
    ["spaces", `[!${" ".repeat(50_000)}]`],
    ["spaces in an identifier", `[!a${" ".repeat(50_000)}b]`],
    ["markers", "[!".repeat(50_000)],
    ["pipes", `[!a${"|".repeat(50_000)}`],
    ["dashes", `[!${"-".repeat(50_000)}]`]
  ])("reads a run of %s in linear time", (_name, text) => {
    const { resolve } = createAlertResolver();
    const started = performance.now();
    isAlertMarkerLine(`> ${text}`);
    const marker = matchAlertMarker(text);
    if (marker) resolve(marker.keyword);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
