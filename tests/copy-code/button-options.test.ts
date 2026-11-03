import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import {
  COPY_CODE_ICONS,
  copyCode,
  type CopyCodeOptions
} from "../../packages/mdit-copy-code/src";
import { rehypeCopyCode } from "../../packages/remd-copy-code/src";
import { satteriCopyCode } from "../../packages/sat-copy-code/src";
import { mirrordown as markdownItPreset } from "../../packages/preset-markdown-it/src";
import { mirrordown as remarkPreset } from "../../packages/preset-remark/src";
import { mirrordown as satteriPreset } from "../../packages/preset-satteri/src";

// The options are shared through core, so every engine must write the same button under them.
const render = (input: string, options: CopyCodeOptions): string[] => [
  new MarkdownIt().use(copyCode, options).render(input),
  String(
    unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeCopyCode, options)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .processSync(input)
  ),
  markdownToHtml(input, { hastPlugins: [satteriCopyCode(options)] }).html
];

const input = "```sh\nnpm test\n```";
const button = (html: string): string =>
  /<button[^]*<\/button>/.exec(html)?.[0] ?? ``;
const STAR = `<svg viewBox="0 0 16 16"><path d="M8 0l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"></path></svg>`;

describe("copy-code: button options", () => {
  // An icon alone doesn't say what the button does, so by default its name shows as a tooltip on hover and focus; once copied, "Copied!", as GitHub shows it.
  it(`by default, shows "Copy code" as its tooltip and "Copied!" after copying`, () => {
    for (const html of render(input, {})) {
      expect(button(html)).toContain(`aria-label="Copy code"`);
      expect(button(html)).toContain(
        `<span class="markdown-copy-code-text" data-state="copy" aria-hidden="true">Copy code</span>`
      );
      expect(button(html)).toContain(
        `<span class="markdown-copy-code-text" data-state="copied" aria-hidden="true">Copied!</span>`
      );
    }
  });

  it(`replaces a state's icon, keeping the default for the other`, () => {
    const [first, ...rest] = render(input, { icons: { copied: STAR } });
    expect(button(first ?? ``)).toContain(
      `<span class="markdown-copy-code-icon" data-state="copied" aria-hidden="true">${STAR}</span>`
    );
    expect(button(first ?? ``)).toContain(
      `data-state="copy" aria-hidden="true">${COPY_CODE_ICONS.copy}</span>`
    );
    for (const html of rest) expect(button(html)).toBe(button(first ?? ``));
  });

  it.each([null, ``])(`leaves out a state's text set to %j`, (cleared) => {
    for (const html of render(input, {
      text: { copy: cleared, copied: cleared }
    })) {
      expect(button(html)).not.toContain(`markdown-copy-code-text`);
      expect(button(html)).toContain(`aria-label="Copy code"`);
    }
  });

  // The icon is all the button holds, so removing it would leave an empty button.
  it(`keeps the default for an empty icon`, () => {
    for (const html of render(input, { icons: { copy: ``, copied: `` } })) {
      expect(button(html)).toContain(
        `data-state="copy" aria-hidden="true">${COPY_CODE_ICONS.copy}</span>`
      );
      expect(button(html)).toContain(
        `data-state="copied" aria-hidden="true">${COPY_CODE_ICONS.copied}</span>`
      );
    }
  });

  // A label shown on screen must be part of the button's name (WCAG 2.5.3), or speech users can't say what they see.
  it(`names the button by its copy text, when it has one`, () => {
    for (const html of render(input, {
      text: { copy: `Copy`, copied: `Done` }
    })) {
      expect(button(html)).toContain(`aria-label="Copy"`);
      expect(button(html)).toContain(
        `<span class="markdown-copy-code-text" data-state="copy" aria-hidden="true">Copy</span>`
      );
      expect(button(html)).toContain(
        `data-state="copied" aria-hidden="true">Done</span>`
      );
    }
  });

  it(`escapes the text, in the pill and in the name`, () => {
    for (const html of render(input, {
      text: { copy: `<Copy "this" & that>` }
    })) {
      expect(button(html)).toContain(
        `aria-label="&lt;Copy &quot;this&quot; &amp; that>"`
      );
      expect(button(html)).toContain(
        `>&lt;Copy &quot;this&quot; &amp; that></span>`
      );
    }
  });

  it(`takes the options through each preset`, () => {
    const copyCode = { text: { copied: `Kopiert!` } };
    const remark = remarkPreset({ copyCode });
    const outputs = [
      new MarkdownIt().use(markdownItPreset, { copyCode }).render(input),
      String(
        unified()
          .use(remarkParse)
          .use(remark.remarkPlugins)
          .use(remarkRehype, remark.remarkRehype)
          .use(remark.rehypePlugins)
          .use(rehypeStringify, { allowDangerousHtml: true })
          .processSync(input)
      ),
      markdownToHtml(input, satteriPreset({ copyCode })).html
    ];
    for (const html of outputs)
      expect(button(html)).toContain(
        `data-state="copied" aria-hidden="true">Kopiert!</span>`
      );
  });
});
