import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import {
  createPrompt,
  placePromptPositions,
  promptHighlight,
  promptIds,
  promptServiceTarget
} from "../../packages/core/src/prompt";
import { prompt } from "../../packages/mdit-prompt/src";

describe("promptServiceTarget", () => {
  // The prompt rides in a hidden input, not a link an agent reads; the template's other parameters ride along.
  it("makes a form of a URL that takes the prompt in its query", () => {
    expect(
      promptServiceTarget(
        `https://chatgpt.com/?hints=search&prompt={prompt}`,
        `Hi & bye`
      )
    ).toEqual({
      kind: `form`,
      action: `https://chatgpt.com/`,
      inputs: [
        [`hints`, `search`],
        [`prompt`, `Hi & bye`]
      ]
    });
  });

  it("keeps text around the prompt in its parameter", () => {
    expect(
      promptServiceTarget(`https://example.com/?q=Context:%20{prompt}`, `x`)
    ).toMatchObject({ inputs: [[`q`, `Context: x`]] });
  });

  // A form can only fill in a query: a prompt in the path, or an app's own scheme, needs a link.
  it("falls back to a link with the prompt filled in where a form can't carry it", () => {
    expect(
      promptServiceTarget(`https://example.com/ask/{prompt}`, `a b`)
    ).toEqual({
      kind: `link`,
      href: `https://example.com/ask/a%20b`,
      copy: false
    });
    expect(
      promptServiceTarget(
        `cursor://anysphere.cursor-deeplink/prompt?text={prompt}`,
        `a`
      )
    ).toMatchObject({ kind: `link`, copy: false });
  });

  // A service whose URL takes no prompt opens for the reader to paste it, which the client script copies.
  it("opens a service whose URL takes no prompt, for the reader to paste it", () => {
    expect(promptServiceTarget(`https://gemini.google.com/app`, `a`)).toEqual({
      kind: `link`,
      href: `https://gemini.google.com/app`,
      copy: true
    });
  });

  // Services and servers refuse very long URLs; past the limit the service opens for pasting instead of failing.
  it("opens the service for pasting when the prompt would make its URL too long", () => {
    expect(
      promptServiceTarget(`https://claude.ai/new?q={prompt}`, `x`.repeat(9000))
    ).toEqual({ kind: `link`, href: `https://claude.ai/new`, copy: true });
  });
});

describe("promptHighlight", () => {
  // VitePress's Shiki returns a whole <pre>: its theme and classes are kept, and its <code>'s content goes in the prompt's.
  it("reads a whole <pre> a highlighter returned", () => {
    expect(
      promptHighlight(
        `<pre class="shiki vp-code" style="--shiki-light:#24292e" tabindex="0"><code><span class="line">x</span></code></pre>`
      )
    ).toEqual({
      html: `<span class="line">x</span>`,
      className: `shiki vp-code`,
      style: `--shiki-light:#24292e`
    });
  });

  it("takes anything else as the <code>'s content", () => {
    expect(promptHighlight(`<span>x</span>`)).toEqual({
      html: `<span>x</span>`
    });
  });
});

describe("createPrompt", () => {
  const render = (
    options: Parameters<typeof createPrompt>[0],
    meta?: string
  ): string => {
    const markup = createPrompt(options)({ source: `Hi\n`, meta }, promptIds());
    return markup ? markup.open + markup.close : ``;
  };

  it("adds services and replaces built-in ones by id", () => {
    const html = render(
      {
        services: {
          claude: {
            label: `Claude Code`,
            url: `https://claude.ai/code?prompt={prompt}`
          },
          docs: {
            label: `Docs AI`,
            url: `https://docs.example.com/ai?q={prompt}`,
            icon: `<svg id="docs"></svg>`
          }
        }
      },
      `claude docs`
    );
    expect(html).toContain(`action="https://claude.ai/code"`);
    expect(html).toContain(`aria-label="Open in Claude Code"`);
    expect(html).toContain(`<svg id="docs"></svg>`);
  });

  // A site that only wants copy buttons empties the default list; a fence can still name services.
  it("uses the default services only where a fence names none", () => {
    expect(render({ defaultServices: [] })).not.toContain(
      `markdown-prompt-service`
    );
    expect(render({ defaultServices: [] }, `grok`)).toContain(
      `data-service="grok"`
    );
  });

  // Hosts such as VS Code's preview open links but don't submit forms; there, a service is a link with the prompt in its URL.
  it("writes links with the prompt filled in when forms are off", () => {
    const html = render({ forms: false }, `claude`);
    expect(html).not.toContain(`<form`);
    expect(html).toContain(`href="https://claude.ai/new?q=Hi"`);
  });

  it("takes its text from the options", () => {
    const html = render({
      text: { title: `Ask AI`, open: `Send to {service}` }
    });
    expect(html).toContain(`>Ask AI</summary>`);
    expect(html).toContain(`aria-label="Send to Claude"`);
  });

  // Without a host highlighter, the plugin's own may highlight the prompt; its output goes in the <code> as is.
  it("highlights with the plugin's highlight option", () => {
    expect(render({ highlight: (code) => `<b>${code}</b>` })).toContain(
      `<code class="language-prompt"><b>Hi</b></code>`
    );
  });

  // Characters no one sees can carry instructions a reader would pass on unread (Unicode tags spell out ASCII): the prompt says so where it's closed, opens on its markdown, and marks each one there, with the character still inside, so what's copied is what the AI gets.
  it("warns of invisible characters and marks them in the markdown", () => {
    const hidden = [0x200b, 0xe0068, 0xe0069]
      .map((code) => String.fromCodePoint(code))
      .join(``);
    const markup = createPrompt()({ source: `Hi${hidden}\n` }, promptIds());
    const html = markup ? markup.open + markup.close : ``;
    expect(html).toMatch(
      /<summary [^>]*>.*<span class="markdown-prompt-warning" role="img" aria-label="Contains invisible characters, marked in its markdown">/
    );
    expect(html).toContain(`value="markdown" checked>`);
    expect(html).not.toContain(`value="preview" checked>`);
    expect(html).toContain(
      `Hi<span class="markdown-prompt-hidden" data-char="U+200B">${String.fromCodePoint(0x200b)}</span><span class="markdown-prompt-hidden" data-char="U+E0068">`
    );
  });

  // Emoji are built with the zero-width joiner and variation selector 16: they're no reason to warn.
  it("doesn't warn of emoji", () => {
    // A woman technologist (woman, zero-width joiner, laptop) and a red heart with its emoji selector.
    const emoji = String.fromCodePoint(
      0x1f469,
      0x200d,
      0x1f4bb,
      0x20,
      0x2764,
      0xfe0f
    );
    const markup = createPrompt()({ source: `${emoji}\n` }, promptIds());
    expect(markup?.open).not.toContain(`markdown-prompt-warning`);
    expect(markup?.close).not.toContain(`markdown-prompt-hidden`);
  });
});

describe("placePromptPositions", () => {
  // A prompt's preview is parsed from its text alone; plugins that read the document's source at a node's position must find the node there, past the blockquote markers its text lost.
  it("moves a preview's positions onto the document", () => {
    const source = `Intro\n\n> \`\`\`prompt\n> Say *hi*.\n> \`\`\`\n`;
    const value = `Say *hi*.`;
    const node = {
      position: {
        start: { line: 1, column: 5, offset: 4 },
        end: { line: 1, column: 9, offset: 8 }
      }
    };
    placePromptPositions([node], value, source, 3);
    const { start, end } = node.position;
    expect(source.slice(start.offset, end.offset)).toBe(`*hi*`);
    expect([start.line, start.column]).toEqual([4, 7]);
  });

  // A wrong position is worse than none: a plugin reading the source there would read some other text.
  it("drops a position it can't place", () => {
    const node: Parameters<typeof placePromptPositions>[0][number] = {
      position: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 3, offset: 2 }
      }
    };
    // The document's line has a tab where the prompt's text has spaces.
    placePromptPositions([node], `  hi`, "```prompt\n\thi\n```", 1);
    expect(node.position).toBeUndefined();
  });
});

describe("mdit-prompt with markdown-it's highlight", () => {
  // As VitePress highlights: the host's highlighter reads the prompt's markdown view as markdown, in its theme, like any code block; the rendered preview keeps the page's colors.
  it("asks it for markdown and keeps what it returns", () => {
    const langs: string[] = [];
    const md = new MarkdownIt({
      highlight: (code, lang) => {
        langs.push(lang);
        return `<pre class="shiki" style="background-color:#24292e;color:#e1e4e8;--shiki-dark:#fff"><code><span>${code.trim()}</span></code></pre>`;
      }
    }).use(prompt);
    const html = md.render("```prompt\nHi\n```");
    expect(langs).toEqual([`markdown`]);
    expect(html).toContain(`<div class="markdown-prompt">`);
    expect(html).toContain(
      `class="markdown-prompt-body shiki" style="background-color:#24292e;color:#e1e4e8;--shiki-dark:#fff"><code class="language-prompt"><span>Hi</span></code>`
    );
  });

  // A highlighter's style goes in an attribute: nothing in it may end the attribute or add a rule.
  it("drops declarations from its style that could escape the attribute", () => {
    const md = new MarkdownIt({
      highlight: (code) =>
        `<pre class="shiki" style="color:#fff;background:url(&quot;x&quot;);x:{}"><code>${code}</code></pre>`
    }).use(prompt);
    expect(md.render("```prompt\nHi\n```")).toContain(`style="color:#fff"`);
  });
});
