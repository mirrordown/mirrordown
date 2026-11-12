---
"@mirrordown/mdit-prompt": patch
"@mirrordown/remd-prompt": patch
"@mirrordown/sat-prompt": patch
---

Fixes for prompts that reached a service altered, and for link definitions shared between a prompt and its page in markdown-it.

- **A prompt holding `$$` or `$&` is sent to the service as written** (all engines).

  ````markdown
  ```prompt
  kill $$
  ```
  ````

  Was `value="kill $"` in the form that opens the service. Now `value="kill $$"`. With `echo $& done` the service received `echo MIRRORDOWNPROMPT done`, and now receives the prompt as written.

- **A link definition inside a prompt belongs to the prompt** (markdown-it).

  ````markdown
  See [docs].

  ```prompt open
  [docs]: https://prompt.example

  Read the [docs].
  ```
  ````

  Was `See <a href="https://prompt.example">docs</a>.` on the page. Now `See [docs].`, with the link only in the prompt's preview, as in remark and Sätteri.

- **A link definition on the page does not link a prompt's text** (markdown-it).

  ````markdown
  [guide]: https://page.example

  The [guide].

  ```prompt open
  Read the [guide].
  ```
  ````

  Was `Read the <a href="https://page.example">guide</a>.` in the preview. Now `Read the [guide].` there, as in remark and Sätteri; the page's own `[guide]` is still a link.

- **The client script does nothing when it is loaded a second time** (all engines). Loaded twice, one press of the copy button wrote the clipboard twice and the button kept the label "Copied prompt".

The guide now documents the `forms` option and says how link definitions, footnotes and heading ids behave across a prompt.
