---
"@mirrordown/preset-markdown-it": minor
"@mirrordown/preset-remark": minor
"@mirrordown/preset-satteri": minor
---

Add `taskLists`, on by default like every other feature, and its stylesheet to each preset's `styles.css`. Pages rendered with a preset change where a list item starts with a box.

- **The markdown-it preset renders GFM's task lists**, as the remark and Sätteri presets already did.

  ```markdown
  - [x] done
  ```

  Was `<ul><li>[x] done</li></ul>`. Now `<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" checked disabled> done</li></ul>`, the same HTML as the other two presets.

- **Six more markers are tasks in every preset**: `/` in progress, `-` cancelled, `>` forwarded, `<` scheduled, `?` question, `!` important.

  ```markdown
  - [?] which licence
  ```

  Was `<ul><li>[?] which licence</li></ul>`. Now `<ul class="contains-task-list"><li class="task-list-item" data-task="?"><input type="checkbox" disabled aria-label="Question"> which licence</li></ul>`, drawn with an icon by the preset's stylesheet. The box is not checked: only `x` is a done task.

- **Any other marker is unchanged.** `- [b] text` and `- [1] reference` stay text.

- **`taskLists` takes the plugin's options**, as well as `true` and `false`: `mirrordown({ taskLists: { markers: { b: "Bookmark" }, fallback: true } })` adds a marker and reads any single character as a task, as Obsidian does. `taskLists: false` leaves the markdown-it preset without task lists and the other two with GFM's.
