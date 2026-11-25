# Changelog



## 0.1.2
<sub>2026-11-25</sub>

- *(patch)*
  Nine extensions load again. Their last release was built without a package they need inside them, so VS Code could not start them and their syntax showed as plain text in the preview.

  - **The extension starts.** The versions published on 2026-11-25 contained `require("@mirrordown/core")`, a package an installed extension does not have, and failed with "Cannot find module '@mirrordown/core'". The package is bundled again, as it was before that release.

    ```markdown
    ==highlighted==
    ```

    Was, with Markdown Mark 0.2.1 installed, `==highlighted==` as text in the preview. Now `<mark>highlighted</mark>`. The same goes for attribute blocks (Markdown Attrs), captions, file trees, alerts and callouts, mermaid diagrams, prompts, steps and tab icons.

## 0.1.1
<sub>2026-11-25</sub>

- *(patch)*
  The extensions work in a workspace VS Code has not been told to trust, the pack installs cleanly in VS Code for the Web, and Inline SVG's preview script loads again.

  - **Every extension works in Restricted Mode.** VS Code switches off an extension that does not say it supports untrusted workspaces, and opens a GitHub repository on vscode.dev or github.dev in Restricted Mode. There, none of these extensions took part in the Markdown preview: tabs, highlights and the rest showed as their source text until the workspace was trusted. Each extension now declares `capabilities.untrustedWorkspaces.supported`. They only turn Markdown into HTML for the preview; none runs code from the workspace or reads its settings.

    ```markdown
    % Demo
    > ==highlighted==
    % Code
    > text
    ```

    Was, in Restricted Mode, the paragraph `% Demo` followed by a quote. Now a tab group with a highlight in its first panel, as in a trusted workspace.

  - **The pack no longer includes `Billaferd.vscode-header-sections`.** It is not a web extension, so installing the pack in VS Code for the Web stopped with "contains extensions which are not supported in Visual Studio Code for the Web". The pack's own Markdown Sectionize wraps a heading and its content in a `<section>`, which is what that extension was there for.

  - **Inline SVG's preview script is found.** The extension told the preview to load `dist/preview.js` and shipped `dist/preview.mjs`, so the request failed with a 404, in the desktop app and on the web, and the script that swaps an SVG image for its own markup never ran. It is now built as `dist/preview.iife.js`, a plain script the preview can run, and the manifest names that file.

## 0.1.0
<sub>2026-11-03</sub>

- *(minor)*
  Add the prompt plugin set, a port of Vocs' Prompts that degrades gracefully: a ` ```prompt ` fence renders as a prompt for readers to hand to an AI, collapsed under its title as a `<details>`, with a copy button and buttons to open it in AI services, each with a tooltip that says what it does. Opened, the prompt shows rendered as markdown by the page's own engine, with its syntax and plugins, as part of the page (a prompt inside a prompt stays a code block), and a switch shows its markdown, which is what the buttons copy and send. A prompt with invisible characters (zero-width characters, bidirectional controls, Unicode tags) warns of them, opens on its markdown, and marks each one there. The remark and Sätteri packages each ship two plugins: `remarkPrompt` or `satteriPromptPreview` parses the preview, and `rehypePrompt` or `satteriPrompt` builds the prompt. Where the plugin isn't installed, such as on GitHub, the fence stays a code block. The fence's meta names the services (`claude`, `chatgpt`, `cursor`, `github-copilot`, `grok`, `gemini`, `perplexity`, `copilot`, `mistral`; Claude and ChatGPT by default), `open` shows the prompt, and `title="…"` names it. Every service lands somewhere the reader reviews the prompt before it's sent: those that take it get it through a GET form, which keeps the prompt out of the links a browsing agent reads, and those that would send it at once or can't take it open for the reader to paste it, copied by the client script. The `services`, `defaultServices`, `text`, `highlight` and `forms` options add services, set the defaults and the words, highlight prompts outside a host highlighter, and write links for hosts that don't submit forms. A prompt is a card in the page's colors, as Vocs draws one, and its markdown view takes the host's highlighting as markdown (Astro's Shiki with `prompt` aliased to `markdown`, or markdown-it's `highlight`); each color can be set with a `--markdown-prompt-*` custom property, and falls back on its own. The Markdown AI Prompts VS Code extension renders them in the preview, in the editor's theme. The markdown-it, remark and Sätteri plugins emit identical HTML.
