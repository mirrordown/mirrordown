# Markdown AI Prompts

Renders prompt code blocks in VSCode's markdown preview as AI prompts to copy or open in Claude, ChatGPT and other services, collapsed by default, in the editor's theme.

## Overview

The `prompt` plugin turns a ` ```prompt ` code fence into a prompt for your readers to hand to an AI: collapsed under a title, with a button to copy it and buttons to open it in Claude, ChatGPT and other services. Opened, the prompt shows rendered as markdown, like the rest of your page, and its markdown, exactly what the buttons copy and send, is a click away. Where the plugin isn't installed, such as on GitHub, the fence stays a code block, so the prompt is still there to copy.

````markdown
```prompt claude chatgpt cursor title="Add Mirrordown to an Astro site"
Read https://example.com/docs/getting-started and add Mirrordown to this Astro site.

Requirements:
- Use the Sätteri preset, `@mirrordown/preset-satteri`
- Import its stylesheet in the root layout
- Run `npm run build` and fix any errors
```
````

It's a port of [Vocs' prompts](https://vocs.dev/writing/markdown-extensions#prompts), written as a code fence rather than a directive, so that it reads as a code block where it isn't rendered.

## Syntax

After `prompt`, the fence's info string can hold, in any order:

- the services to link to, by id: `claude`, `chatgpt`, `cursor` and the rest below. Without any, the prompt links to Claude and ChatGPT;
- `open`, to show the prompt rather than only its title, for a short prompt readers should see at a glance;
- `title="…"` (or `title='…'`, or `title=word`), the prompt's title. Without one, it's "Prompt".

````markdown
```prompt open title="Explain this page"
Summarize https://example.com/docs/prompts in three bullet points.
```
````

Write the prompt in markdown, as you would write it to the AI: it's copied and sent exactly as written.

## Preview and markdown

An opened prompt shows rendered, as any markdown on your page is, in your page's own styles. **Markdown** switches to the prompt as it's written, which is what the copy button and the services take; **Preview** switches back. The switch is a pair of radio buttons, so it works without JavaScript, and from the keyboard with the arrow keys.

The preview is part of your page: your markdown engine renders it with the rest, with your syntax and your plugins, and raw HTML as your page renders it. Only a prompt inside a prompt doesn't render: it stays a code block. A preview shows what markdown shows, so it can leave out what the markdown holds, such as an HTML comment; the markdown view shows the prompt exactly as it's copied.

`````markdown
````prompt open title="What the preview leaves out"
Summarize **this page**. <!-- A comment shows only in the markdown. -->

```prompt
A prompt in a prompt stays a code block.
```
````
`````

### Invisible characters

Some characters show as nothing at all, or reorder the text around them: zero-width spaces, bidirectional controls, and Unicode tags, which spell out text no reader sees but an AI can read. A prompt that holds any warns of them in its title, opens on its markdown, and marks each one there with its code point. They're still copied and sent as written, so the AI gets the prompt the reader was warned about. The zero-width joiner and the emoji variation selector don't count, since emoji are built with them.

````markdown
```prompt open title="Zero-width spaces"
Summarize​ this page.​
```
````

## Services

Each service lands somewhere the reader reads the prompt before it's sent. Most fill it in for the reader to send; for those that would send it at once, or can't take one, the button copies the prompt and opens the service for the reader to paste it.

| Id | Service | What the button does |
| --- | --- | --- |
| `claude` | Claude | fills it in, under Claude's warning about prompts from links |
| `chatgpt` | ChatGPT | fills it in |
| `github-copilot` | GitHub Copilot | fills it in |
| `grok` | Grok | fills it in, and asks before sending |
| `cursor` | Cursor | shows it on Cursor's site, then opens it in the app |
| `gemini` | Gemini | copies it, and opens Gemini |
| `perplexity` | Perplexity | copies it, and opens Perplexity (which would search for a prompt it's given at once) |
| `copilot` | Microsoft Copilot | copies it, and opens Copilot |
| `mistral` | Le Chat | copies it, and opens Le Chat |

````markdown
```prompt gemini perplexity github-copilot grok title="Every kind of button"
What does the prompt plugin do?
```
````

A service that takes the prompt gets it through a form, not a link: the prompt is in a hidden field, and goes in the service's URL only when the reader presses the button. A prompt that would make the URL too long for the service (over about 8,000 characters) is copied for pasting instead. Without the client script, the services that copy just open.

The icons are from [Lobe Icons](https://github.com/lobehub/lobe-icons) (MIT); the logos are their owners' trademarks.

## Highlighting

A prompt's markdown view is highlighted as markdown by your site's own highlighter, so it matches your code blocks.

- **Astro** highlights code with Shiki before the plugins run. Alias `prompt` to markdown, and keep each fence's meta on its `<pre>`, where the plugin reads the services, `open` and the title:

  ```ts
  // astro.config.ts
  export default defineConfig({
    markdown: {
      shikiConfig: {
        langAlias: { prompt: "markdown" },
        transformers: [
          {
            pre(node) {
              const meta = this.options.meta?.__raw;
              if (meta) node.properties.dataMeta = meta;
            },
          },
        ],
      },
    },
  });
  ```

  The markdown view takes Shiki's theme, as your other code blocks do.

- **markdown-it** (VitePress) gives the prompt to markdown-it's `highlight` function as markdown; VitePress's Shiki highlights it with no setup.

- **Elsewhere**, the plugin's `highlight` option takes a synchronous function from the prompt's text to the HTML for its `<code>`, such as Shiki's synchronous highlighter. Without one, the markdown view is plain text.

## The client script

Import it once per page, from the package for your engine. It shows the copy buttons, which render hidden so a page without it has no button that does nothing, and copies the prompt for the services that open for the reader to paste it. A screen reader hears that the prompt was copied, and where to paste it.

```ts
import "@mirrordown/remd-prompt/client";
```

## Prompts and AI agents

A prompt is text for your readers to give to an AI; an AI agent reading your docs shouldn't take it as instructions for itself. How much an agent sees of a collapsed prompt depends on how it reads the page:

- **Agents that drive a browser** read a page's rendered text, or its accessibility tree. A collapsed prompt is in neither, and neither are the services' forms; a link with the prompt in its URL would be, which is why the plugin uses forms.
- **Tools that fetch a page's HTML** see everything in it, collapsed or not: the rendered preview, and the markdown, as a `<pre><code class="language-prompt">`, which turns back into a ` ```prompt ` fence when the page is converted to markdown, a quoted block rather than prose.
- **Your markdown itself**, wherever it's read raw (on GitHub, in an `llms.txt`, or in `.md` versions of your pages), holds the prompt in a fenced code block too.

So the plugin keeps prompts quoted and out of sight of browsing agents, but no markup can stop a model from following text it reads. Write prompts that say who they're for ("Ask your coding agent to…"), and keep instructions you don't want followed out of your docs.

## Styling

This extension ships default styles for the rendered output in the preview. To
customize them, point VSCode's `markdown.styles` setting at your own CSS file:

```jsonc
// .vscode/settings.json
{
  "markdown.styles": ["./my-preview-styles.css"]
}
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-prompt`](https://www.npmjs.com/package/@mirrordown/mdit-prompt) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
