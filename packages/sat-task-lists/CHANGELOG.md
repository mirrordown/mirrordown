# Changelog


## 0.1.1
<sub>2026-11-26</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.4.0

## 0.1.0
<sub>2026-11-24</sub>

- *(minor)*
  Add the task-lists plugin set: GFM's task lists in markdown-it, and six more task markers in markdown-it, remark and Sätteri, each with a meaning, a label and an icon.

  - **markdown-it renders GFM's task lists**, byte for byte as remark-gfm and Sätteri do.

    ```markdown
    - [ ] to do
    - [x] done
    ```

    Renders `<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" disabled> to do</li><li class="task-list-item"><input type="checkbox" checked disabled> done</li></ul>`. In remark and Sätteri these two stay GFM's own: the plugin leaves them alone when GFM is on, and reads them itself when it is off.

  - **Six more markers say what state a task is in** (all engines): `/` in progress, `-` cancelled, `>` forwarded, `<` scheduled, `?` question, `!` important. They are the markers the Obsidian community's themes and the Tasks plugin agree on.

    ```markdown
    - [/] writing the guide
    - [?] which licence
    ```

    Renders `<li class="task-list-item" data-task="/"><input type="checkbox" disabled aria-label="In progress"> writing the guide</li>` and `<li class="task-list-item" data-task="?"><input type="checkbox" disabled aria-label="Question"> which licence</li>`. Only `x` is a done task: none of the six is checked, since a task that is in progress, cancelled or put off is not finished. Obsidian itself ticks every box but an empty one.

  - **Any other marker is text.** `- [b] text`, `- [1] reference` and `- [!NOTE] text` render as written.

  - **The `markers` option** (all engines) adds a marker, relabels one, which is also how the labels are translated, or turns one off. **`fallback: true`** reads any single character as a task, as Obsidian does; such a marker gets `data-task` and no label.

    ```ts
    remarkTaskLists({
      markers: {
        b: "Bookmark", // - [b] read later is a task labelled "Bookmark"
        "?": "Frage", // relabelled
        "!": false // - [!] text is text again
      }
    })
    ```

  - **A stylesheet draws an icon for each of the six** (all engines), in its own colour, in a light and a dark scheme: a dashed circle, a square with a minus, an arrow, a calendar, a circle with a question mark and a triangle with an exclamation mark, from Lucide. To-do and done keep the browser's checkbox. Import `@mirrordown/mdit-task-lists/styles`, `@mirrordown/remd-task-lists/task-lists.css` or `@mirrordown/sat-task-lists/task-lists.css`; without it the six show an unchecked box. Each colour takes any CSS colour through a custom property:

    ```css
    :root { --markdown-task-lists-question: oklch(0.6 0.16 300); }
    ```

  - **remark needs the set's handlers for the label.** Pass `taskListsHastHandlers` to `remark-rehype` (`{ handlers: taskListsHastHandlers }`); without them a task renders with an unlabelled box.

  Known difference: in Sätteri a box followed only by an attribute block, `- [?] {.cls}`, is text; markdown-it and remark render a task with no text.

  `@mirrordown/core` gains `createTaskResolver`, `matchTaskBox`, `startAfterBox`, `TASK_MARKERS` and the `TaskListsOptions` type.
