import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified, type Pluggable } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import { imageSize } from "../../packages/mdit-image-size/src";
import { prompt } from "../../packages/mdit-prompt/src";
import { ruby } from "../../packages/mdit-ruby/src";
import {
  githubAlertsHastHandlers,
  remarkGithubAlerts
} from "../../packages/remd-github-alerts/src";
import { remarkImageSize } from "../../packages/remd-image-size/src";
import { rehypePrompt, remarkPrompt } from "../../packages/remd-prompt/src";
import { remarkRuby } from "../../packages/remd-ruby/src";
import { satteriGithubAlerts } from "../../packages/sat-github-alerts/src";
import { satteriImageSize } from "../../packages/sat-image-size/src";
import {
  satteriPrompt,
  satteriPromptPreview
} from "../../packages/sat-prompt/src";
import { satteriRuby } from "../../packages/sat-ruby/src";
import { normalizeHtml } from "../utils/index.js";

// The plugin orders the guide states, pinned in both directions: the supported order gives what markdown-it gives in any order, and the other order shows what goes wrong.

const remark = (plugins: Pluggable[], input: string): string =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(plugins)
        .use(remarkRehype, { handlers: githubAlertsHastHandlers })
        .use(rehypePrompt)
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(input)
    )
  );
const satteri = (
  mdastPlugins: Array<
    | ReturnType<typeof satteriGithubAlerts>
    | ReturnType<typeof satteriImageSize>
    | ReturnType<typeof satteriPromptPreview>
    | ReturnType<typeof satteriRuby>
  >,
  input: string
): string =>
  normalizeHtml(
    markdownToHtml(input, {
      mdastPlugins,
      hastPlugins: [satteriPrompt()]
    }).html
  );

const sized = '<img src="u.jpg" alt="b" width="100">';

// A ruby's reading is parsed again from its source by the remark and Sätteri plugins, which makes new image nodes.
describe("image-size after ruby", () => {
  const input = "{a|![b|100](u.jpg)}";
  const expected = `<p><ruby>a<rt>${sized}</rt></ruby></p>`;

  it("markdown-it sizes the reading's image in either order", () => {
    for (const md of [
      new MarkdownIt().use(ruby).use(imageSize),
      new MarkdownIt().use(imageSize).use(ruby)
    ]) {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  });

  it("remark and Sätteri size it listed after ruby", () => {
    expect(remark([remarkRuby, remarkImageSize], input)).toBe(expected);
    expect(satteri([satteriRuby(), satteriImageSize()], input)).toBe(expected);
  });

  it("remark and Sätteri miss it listed before ruby", () => {
    const missed =
      '<p><ruby>a<rt><img src="u.jpg" alt="b|100"></rt></ruby></p>';
    expect(remark([remarkImageSize, remarkRuby], input)).toBe(missed);
    expect(satteri([satteriImageSize(), satteriRuby()], input)).toBe(missed);
  });
});

// A prompt's preview is made by the remark and Sätteri plugins, from the prompt's text.
describe("image-size after a prompt's preview", () => {
  const input = "```prompt open\n![b|100](u.jpg)\n```";

  it("markdown-it sizes the preview's image in either order", () => {
    for (const md of [
      new MarkdownIt().use(prompt).use(imageSize),
      new MarkdownIt().use(imageSize).use(prompt)
    ]) {
      expect(normalizeHtml(md.render(input))).toContain(sized);
    }
  });

  it("remark and Sätteri size it listed after the preview", () => {
    expect(remark([remarkPrompt, remarkImageSize], input)).toContain(sized);
    expect(
      satteri([satteriPromptPreview(), satteriImageSize()], input)
    ).toContain(sized);
  });

  it("remark and Sätteri miss it listed before the preview", () => {
    const missed = '<img src="u.jpg" alt="b|100">';
    expect(remark([remarkImageSize, remarkPrompt], input)).toContain(missed);
    expect(
      satteri([satteriImageSize(), satteriPromptPreview()], input)
    ).toContain(missed);
  });
});

// Sätteri's alerts plugin writes a title's `aria-label` when it runs, from the alt the image has then. markdown-it and remark write it later, once the image is sized.
describe("image-size before alerts", () => {
  const input = "> [!NOTE] ![b|100](u.jpg)\n> body";
  const label = (html: string): string | undefined =>
    /aria-label="([^"]*)"/.exec(html)?.[1];

  it("markdown-it and remark label the title without the size in either order", () => {
    for (const md of [
      new MarkdownIt().use(githubAlerts).use(imageSize),
      new MarkdownIt().use(imageSize).use(githubAlerts)
    ]) {
      expect(label(md.render(input))).toBe("b");
    }
    expect(label(remark([remarkGithubAlerts, remarkImageSize], input))).toBe(
      "b"
    );
    expect(label(remark([remarkImageSize, remarkGithubAlerts], input))).toBe(
      "b"
    );
  });

  it("Sätteri labels it without the size listed before alerts, and with it listed after", () => {
    expect(
      label(satteri([satteriImageSize(), satteriGithubAlerts()], input))
    ).toBe("b");
    expect(
      label(satteri([satteriGithubAlerts(), satteriImageSize()], input))
    ).toBe("b|100");
  });
});
