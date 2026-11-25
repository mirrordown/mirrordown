---
"markdown-block-ids": minor
"markdown-image-size": minor
"markdown-task-lists": minor
"markdown-preview-extended-syntax": minor
---

Three new preview extensions, for the block identifier, image size and task list plugins, and the pack includes them.

- **Markdown Obsidian Block IDs** (`saeris.markdown-block-ids`). A block identifier is removed from the text and becomes the block's `id` in the preview, so a link to it jumps there.

  ```markdown
  The quick purple gem. ^37066d

  [Back to the gem](#^37066d)
  ```

  Was, in the preview, a paragraph ending in `^37066d` and a link that went nowhere. Now `<p id="^37066d">The quick purple gem.</p>`, and the link scrolls to it.

  A heading keeps its block identifier too. VS Code's preview writes its own slug over whatever id a heading has, so the extension puts the identifier back:

  ```markdown
  ## Setup ^setup
  ```

  Renders `<h2 id="^setup">Setup</h2>` in the preview, where the plugin alone would leave `id="setup"` and a link to `#^setup` would find nothing.

- **Markdown Obsidian Image Size** (`saeris.markdown-image-size`). A size written in an image's description sets its width and height.

  ```markdown
  ![Swan|100x40](swan.jpg)
  ```

  Was an image at its own size with the alt text `Swan|100x40`. Now `<img alt="Swan" width="100" height="40">`.

- **Markdown Task Lists & Obsidian Statuses** (`saeris.markdown-task-lists`). GFM's two boxes, and the six task statuses Obsidian's community uses, each with its icon and label.

  ```markdown
  - [ ] To do
  - [x] Done
  - [/] In progress
  - [?] Question
  ```

  Was four list items starting with their brackets as text. Now two checkboxes and two status icons, in the colours of the editor's light or dark theme.

- **Markdown Preview Extended Syntax** includes the three.
