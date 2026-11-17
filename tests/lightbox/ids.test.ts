import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { lightbox } from "../../packages/mdit-lightbox/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { rehypeLightbox } from "../../packages/remd-lightbox/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriLightbox } from "../../packages/sat-lightbox/src";
import { normalizeHtml } from "../utils/index.js";

// A trigger names its dialog by id (`commandfor`), and the browser resolves that to the first element in the document with the id. So the runtime only works while each dialog id is on exactly one element, and that element is the dialog built for the trigger's own image. Author ids (`{#id}`) can break both; these tests pin the rule that keeps every trigger opening its own image.
const engines = [
  {
    engine: `markdown-it`,
    render: (input: string) =>
      new MarkdownIt().use(attrs).use(lightbox).render(input)
  },
  {
    engine: `remark`,
    render: (input: string) =>
      String(
        unified()
          .use(remarkParse)
          .use(remarkAttrs)
          .use(remarkRehype)
          .use(rehypeLightbox)
          .use(rehypeStringify)
          .processSync(input)
      )
  },
  {
    engine: `sätteri`,
    render: (input: string) =>
      markdownToHtml(input, {
        features: { attributes: true, smartPunctuation: false },
        hastPlugins: [satteriLightbox()]
      }).html
  }
].map(({ engine, render }) => ({
  engine,
  render: (input: string) => normalizeHtml(render(input))
}));

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;
const dialog = (id: string, img: string) =>
  `<dialog id="${id}" class="markdown-lightbox" closedby="any"><button type="button" class="markdown-lightbox-close" command="close" commandfor="${id}" aria-label="Close image">${img}</button></dialog>`;
const trigger = (id: string, img: string) =>
  `<button type="button" class="markdown-lightbox-trigger" command="show-modal" commandfor="${id}">${img}</button>`;

describe("lightbox ids: one id on two different images does not show the first image for both", () => {
  const input = "!![a](x.jpg){#same} !![b](y.jpg){#same}";
  const [first] = engines.map(({ render }) => render(input));
  it.each(engines)("$engine", ({ render }) => {
    const html = render(input);
    expect(html).toBe(first);
    // The first image keeps the name; the second falls back to its generated id and gets its own dialog.
    expect(html).toContain(dialog(`same`, `<img src="x.jpg" alt="a">`));
    const generated = /commandfor="(markdown-lightbox-[a-z0-9]+)"/.exec(
      html
    )?.[1];
    expect(generated).toBeDefined();
    expect(html).toContain(
      trigger(String(generated), `<img src="y.jpg" alt="b">`)
    );
    expect(html).toContain(
      dialog(String(generated), `<img src="y.jpg" alt="b">`)
    );
    expect(count(html, / id="same"/g)).toBe(1);
  });
});

describe("lightbox ids: two ids on the same image both stay reachable", () => {
  // Before, the last id won and the other vanished from the document, breaking any link to it.
  const input = "!![a](x.jpg){#one} !![b](x.jpg){#two}";
  const [first] = engines.map(({ render }) => render(input));
  it.each(engines)("$engine", ({ render }) => {
    const html = render(input);
    expect(html).toBe(first);
    expect(html).toContain(trigger(`one`, `<img src="x.jpg" alt="a">`));
    expect(html).toContain(trigger(`two`, `<img src="x.jpg" alt="b">`));
    expect(html).toContain(dialog(`one`, `<img src="x.jpg" alt="a">`));
    expect(html).toContain(dialog(`two`, `<img src="x.jpg" alt="b">`));
  });
});

describe("lightbox ids: an unnamed reference shares the first name given to its image, wherever that is", () => {
  const input = "!![a](x.jpg)\n\n!![b](x.jpg){#one}\n\n!![c](x.jpg){#two}";
  const [first] = engines.map(({ render }) => render(input));
  it.each(engines)("$engine", ({ render }) => {
    const html = render(input);
    expect(html).toBe(first);
    expect(html).toContain(trigger(`one`, `<img src="x.jpg" alt="a">`));
    expect(count(html, /<dialog/g)).toBe(2);
  });
});

describe("lightbox ids: an id another element already has is not reused, so the trigger still opens the dialog", () => {
  // `commandfor="fig1"` would resolve to the heading, which is not a dialog: the image would never open.
  const input = "# Title {#fig1}\n\n!![a](x.jpg){#fig1}";
  const [first] = engines.map(({ render }) => render(input));
  it.each(engines)("$engine", ({ render }) => {
    const html = render(input);
    expect(html).toBe(first);
    expect(html).toContain(`<h1 id="fig1">Title</h1>`);
    expect(count(html, /id="fig1"/g)).toBe(1);
    expect(html).not.toContain(`commandfor="fig1"`);
    expect(html).toMatch(
      /commandfor="(markdown-lightbox-[a-z0-9]+)"><img src="x\.jpg" alt="a"><\/button><\/p><dialog id="\1"/
    );
  });
});

describe("lightbox ids (markdown-it): an id is escaped like any other attribute value", () => {
  // markdown-it writes the trigger and dialog as strings, and the id is whatever an attributes plugin put on the image token: mdit-attrs happens to strip quotes, another plugin may not.
  it("a quote in the id cannot end the attribute", () => {
    const md = new MarkdownIt().use(lightbox);
    md.core.ruler.before("lightbox", "test_id", (state) => {
      for (const block of state.tokens) {
        for (const token of block.children ?? []) {
          if (token.type === "image") token.attrSet("id", `a"b<c`);
        }
      }
    });
    const html = md.render("!![a](x.jpg)");
    expect(html).toContain(`<dialog id="a&quot;b&lt;c" `);
    expect(count(html, /commandfor="a&quot;b&lt;c"/g)).toBe(2);
    expect(html).not.toContain(`a"b`);
  });
});
