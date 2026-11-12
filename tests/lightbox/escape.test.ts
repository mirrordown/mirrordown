import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { lightbox } from "../../packages/mdit-lightbox/src";
import { rehypeLightbox } from "../../packages/remd-lightbox/src";
import { satteriLightbox } from "../../packages/sat-lightbox/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(lightbox);
const remark = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeLightbox)
  .use(rehypeStringify);

const engines = [
  { engine: `markdown-it`, render: (input: string) => md.render(input) },
  {
    engine: `remark`,
    render: (input: string) => String(remark.processSync(input))
  },
  {
    engine: `sätteri`,
    render: (input: string) =>
      markdownToHtml(input, {
        features: { gfm: false, frontmatter: false, smartPunctuation: false },
        hastPlugins: [satteriLightbox()]
      }).html
  }
];

// The paragraph alone: the dialogs at the end of the document are covered by the fixtures.
const paragraph = (html: string): string =>
  normalizeHtml(html).replace(/<dialog.*<\/dialog>/s, ``);

const TRIGGER = `<button type="button" class="markdown-lightbox-trigger" command="show-modal" commandfor="markdown-lightbox-1fctfbi"><img src="x.png" alt="x"></button>`;

// The marker is the `!` an engine leaves as text before an image, and by then an escaped or referenced `!` is the same character as a typed one. So the marker cannot be escaped, in any engine: this is today's behaviour, pinned so that the three change together if it is ever decided otherwise, and so the guide's advice (a space) keeps working.
describe(`lightbox: the marker cannot be escaped`, () => {
  describe.each([
    [`a backslash before the marker`, `\\!![x](x.png)`, `<p>${TRIGGER}</p>`],
    [
      `a character reference for the marker`,
      `&#33;![x](x.png)`,
      `<p>${TRIGGER}</p>`
    ],
    [
      `a backslash before the marker, after text`,
      `a \\!![x](x.png)`,
      `<p>a ${TRIGGER}</p>`
    ],
    // What an author writes instead, for a literal `!` before a plain image.
    [
      `a space between a ! and the image`,
      `! ![x](x.png)`,
      `<p>! <img src="x.png" alt="x"></p>`
    ],
    // Escaping the image's own `!` is CommonMark's business: there is no image left to open.
    [
      `a backslash before the image's own !`,
      `!\\![x](x.png)`,
      `<p>!!<a href="x.png">x</a></p>`
    ]
  ])(`%s`, (_name, input, expected) => {
    it.each(engines)(`$engine`, ({ render }) => {
      expect(paragraph(render(input))).toBe(expected);
    });
  });
});
