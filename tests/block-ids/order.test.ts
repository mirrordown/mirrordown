import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import type { PluginSimple } from "markdown-it";
import { unified, type Pluggable } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml, type MdastPluginEntry } from "satteri";
import { blockIds } from "../../packages/mdit-block-ids/src";
import { abbr } from "../../packages/mdit-abbr/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { caption } from "../../packages/mdit-caption/src";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import { slug } from "../../packages/mdit-slug/src";
import { remarkBlockIds } from "../../packages/remd-block-ids/src";
import { remarkAbbr } from "../../packages/remd-abbr/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { remarkCaption } from "../../packages/remd-caption/src";
import {
  githubAlertsHastHandlers,
  remarkGithubAlerts
} from "../../packages/remd-github-alerts/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { satteriBlockIds } from "../../packages/sat-block-ids/src";
import { satteriAbbr } from "../../packages/sat-abbr/src";
import { satteriCaption } from "../../packages/sat-caption/src";
import { satteriGithubAlerts } from "../../packages/sat-github-alerts/src";
import { satteriSteps } from "../../packages/sat-steps/src";
import { satteriTabs } from "../../packages/sat-tabs/src";
import { normalizeHtml } from "../utils/index.js";

const mdit =
  (...plugins: PluginSimple[]) =>
  (input: string): string => {
    const md = new MarkdownIt();
    for (const plugin of plugins) md.use(plugin);
    return normalizeHtml(md.render(input));
  };

const remark =
  (...plugins: Pluggable[]) =>
  (input: string): string =>
    normalizeHtml(
      String(
        unified()
          .use(remarkParse)
          .use(plugins)
          .use(remarkRehype, {
            handlers: {
              ...githubAlertsHastHandlers,
              ...stepsHastHandlers,
              ...tabsHastHandlers
            } as never
          })
          .use(rehypeStringify)
          .processSync(input)
      )
    );

const satteri =
  (...plugins: MdastPluginEntry[]) =>
  (input: string): string =>
    normalizeHtml(
      markdownToHtml(input, {
        features: {
          gfm: false,
          attributes: true,
          frontmatter: false,
          smartPunctuation: false
        },
        mdastPlugins: plugins
      }).html
    );

const noIcons = { icons: false } as const;

describe("block-ids order: markdown-it", () => {
  // The plugin's rule sits right after `linkify`, before `text_join`: after attrs and before caption and slug whichever is added first, and it rewrites an alert title's label itself, so github-alerts' label rule can run on either side of it.
  it.each([
    ["github-alerts", githubAlerts, "> [!tip] Tip ^t\n>\n> Body"],
    [
      "github-alerts, a title that was only a marker",
      githubAlerts,
      "> [!note] ^blk"
    ],
    ["attrs", attrs, "text ^blk\n{#name}"],
    ["slug", slug, "## Same ^x\n\n## Same"],
    ["caption", caption, "Para\n~: A caption ^x"]
  ] as const)("names the same block before or after %s", (_, plugin, input) => {
    expect(mdit(plugin, blockIds)(input)).toBe(mdit(blockIds, plugin)(input));
  });

  // abbr's rule also sits right after `linkify`, and a rule added later runs first there: added before abbr, block-ids would read the text after abbr took the identifier as a term.
  it("takes a marker before abbr when added after it", () => {
    const input = "*[x]: def\n\ntext ^x";
    expect(mdit(abbr, blockIds)(input)).toBe('<p id="^x">text</p>');
    expect(mdit(blockIds, abbr)(input)).not.toBe('<p id="^x">text</p>');
  });
});

describe("block-ids order: remark", () => {
  // A tab panel's or a step's body is a blockquote until tabs or steps builds it: read before, a marker there would name the quote.
  it("names a panel's paragraph only after tabs", () => {
    const input = "% A\n> body ^x";
    expect(remark(remarkTabs, remarkBlockIds)(input)).toContain(
      '<p id="^x">body</p>'
    );
    expect(remark(remarkBlockIds, remarkTabs)(input)).not.toContain(
      '<p id="^x">body</p>'
    );
  });

  it("names a step's paragraph only after steps", () => {
    const input = "@1. Step\n>  body ^s";
    expect(remark(remarkSteps, remarkBlockIds)(input)).toContain(
      '<p id="^s">body</p>'
    );
    expect(remark(remarkBlockIds, remarkSteps)(input)).not.toContain(
      '<p id="^s">body</p>'
    );
  });

  // Rule 6: attrs takes an attribute block off the end of a block first, so the marker before it ends the block.
  it("removes a marker before an attribute block only after attrs", () => {
    const input = "text ^blk\n{#name}";
    expect(remark(remarkAttrs, remarkBlockIds)(input)).toBe(
      '<p id="name">text</p>'
    );
    expect(remark(remarkBlockIds, remarkAttrs)(input)).not.toBe(
      '<p id="name">text</p>'
    );
  });

  // Before caption, a caption line is the paragraph's last line, so a marker ending it names the paragraph, whose id caption moves onto the figure.
  it("names a figure from its caption only before caption", () => {
    const input = "Para\n~: A caption ^x";
    const figure =
      '<figure class="markdown-caption" id="^x"><p>Para</p><figcaption>A caption</figcaption></figure>';
    expect(remark(remarkBlockIds, remarkCaption)(input)).toBe(figure);
    expect(remark(remarkCaption, remarkBlockIds)(input)).not.toBe(figure);
  });

  // abbr would take the identifier as a term and leave no text to end the paragraph.
  it("takes a marker before abbr", () => {
    const input = "*[x]: def\n\ntext ^x";
    expect(remark(remarkBlockIds, remarkAbbr)(input)).toBe(
      '<p id="^x">text</p>'
    );
    expect(remark(remarkAbbr, remarkBlockIds)(input)).not.toBe(
      '<p id="^x">text</p>'
    );
  });

  // Before github-alerts, the quote's id goes with it into the alert; after, the alert is still a blockquote, and its title is read as its first line.
  it.each([
    "> [!tip] Tip\n> Body ^b",
    "> [!tip] Tip ^t\n>\n> Body",
    "> [!tip] Tip ^t\n> Body",
    "> [!note] ^blk"
  ])("names the same alert before or after github-alerts: %j", (input) => {
    expect(remark([remarkGithubAlerts, noIcons], remarkBlockIds)(input)).toBe(
      remark(remarkBlockIds, [remarkGithubAlerts, noIcons])(input)
    );
  });
});

describe("block-ids order: Sätteri", () => {
  it("names a panel's paragraph only after tabs", () => {
    const input = "% A\n> body ^x";
    expect(satteri(satteriTabs(), satteriBlockIds())(input)).toContain(
      '<p id="^x">body</p>'
    );
    expect(satteri(satteriBlockIds(), satteriTabs())(input)).not.toContain(
      '<p id="^x">body</p>'
    );
  });

  it("names a step's paragraph only after steps", () => {
    const input = "@1. Step\n>  body ^s";
    expect(satteri(satteriSteps(), satteriBlockIds())(input)).toContain(
      '<p id="^s">body</p>'
    );
    expect(satteri(satteriBlockIds(), satteriSteps())(input)).not.toContain(
      '<p id="^s">body</p>'
    );
  });

  it("names a figure from its caption only before caption", () => {
    const input = "Para\n~: A caption ^x";
    const figure =
      '<figure class="markdown-caption" id="^x"><p>Para</p><figcaption>A caption</figcaption></figure>';
    expect(satteri(satteriBlockIds(), satteriCaption())(input)).toBe(figure);
    expect(satteri(satteriCaption(), satteriBlockIds())(input)).not.toBe(
      figure
    );
  });

  it("takes a marker before abbr", () => {
    const input = "*[x]: def\n\ntext ^x";
    expect(satteri(satteriBlockIds(), satteriAbbr())(input)).toBe(
      '<p id="^x">text</p>'
    );
    expect(satteri(satteriAbbr(), satteriBlockIds())(input)).not.toBe(
      '<p id="^x">text</p>'
    );
  });

  // Sätteri reads attribute blocks itself, before any plugin, so rule 6 holds wherever the plugin is listed.
  it("leaves an id written with an attribute block to the block", () => {
    expect(satteri(satteriBlockIds())("text ^blk\n{#name}")).toBe(
      '<p id="name">text</p>'
    );
  });

  it.each([
    "> [!tip] Tip\n> Body ^b",
    "> [!tip] Tip ^t\n>\n> Body",
    "> [!tip] Tip ^t\n> Body",
    "> [!note] ^blk"
  ])("names the same alert before or after github-alerts: %j", (input) => {
    expect(
      satteri(satteriGithubAlerts(noIcons), satteriBlockIds())(input)
    ).toBe(satteri(satteriBlockIds(), satteriGithubAlerts(noIcons))(input));
  });

  // The alert Sätteri's github-alerts builds keeps no position, and its title has lost the `[!TYPE]` before it, so after it a title is read without its line: a caret written straight after the type passes for a marker. Before it (as the preset lists them), the line is a paragraph's and the caret is text.
  it("reads an alert title's line only before github-alerts", () => {
    const input = "> [!tip]^no";
    expect(
      satteri(satteriBlockIds(), satteriGithubAlerts(noIcons))(input)
    ).toBe(
      '<div class="markdown-alert" data-alert="tip"><p class="markdown-alert-title" aria-label="^no">^no</p></div>'
    );
    expect(
      satteri(satteriGithubAlerts(noIcons), satteriBlockIds())(input)
    ).toBe(
      '<div class="markdown-alert" data-alert="tip" id="^no"><p class="markdown-alert-title" aria-label="Tip">Tip</p></div>'
    );
  });
});
