# Changelog


## 0.2.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.1.0
<sub>2026-11-03</sub>

- *(minor)*
  Add the prompt plugin set, a port of Vocs' Prompts that degrades gracefully: a ` ```prompt ` fence renders as a prompt for readers to hand to an AI, collapsed under its title as a `<details>`, with a copy button and buttons to open it in AI services, each with a tooltip that says what it does. Opened, the prompt shows rendered as markdown by the page's own engine, with its syntax and plugins, as part of the page (a prompt inside a prompt stays a code block), and a switch shows its markdown, which is what the buttons copy and send. A prompt with invisible characters (zero-width characters, bidirectional controls, Unicode tags) warns of them, opens on its markdown, and marks each one there. The remark and Sätteri packages each ship two plugins: `remarkPrompt` or `satteriPromptPreview` parses the preview, and `rehypePrompt` or `satteriPrompt` builds the prompt. Where the plugin isn't installed, such as on GitHub, the fence stays a code block. The fence's meta names the services (`claude`, `chatgpt`, `cursor`, `github-copilot`, `grok`, `gemini`, `perplexity`, `copilot`, `mistral`; Claude and ChatGPT by default), `open` shows the prompt, and `title="…"` names it. Every service lands somewhere the reader reviews the prompt before it's sent: those that take it get it through a GET form, which keeps the prompt out of the links a browsing agent reads, and those that would send it at once or can't take it open for the reader to paste it, copied by the client script. The `services`, `defaultServices`, `text`, `highlight` and `forms` options add services, set the defaults and the words, highlight prompts outside a host highlighter, and write links for hosts that don't submit forms. A prompt is a card in the page's colors, as Vocs draws one, and its markdown view takes the host's highlighting as markdown (Astro's Shiki with `prompt` aliased to `markdown`, or markdown-it's `highlight`); each color can be set with a `--markdown-prompt-*` custom property, and falls back on its own. The Markdown AI Prompts VS Code extension renders them in the preview, in the editor's theme. The markdown-it, remark and Sätteri plugins emit identical HTML.
