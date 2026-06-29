---
"@mirrordown/mdit-lightbox": minor
"@mirrordown/remd-lightbox": minor
"markdown-lightbox": minor
---

Add the lightbox plugin set: opt an image into a JavaScript-free, click-to-zoom `<dialog>` lightbox with a leading `!!` (e.g. `!![Alt](photo.jpg)`). The image becomes a `<button>` trigger that opens a modal `<dialog>` — open, close, backdrop dismiss, `Esc`, focus trapping, and the zoom/fade animation are all declarative HTML and CSS (`<dialog>` + Invoker Commands + `closedby` + `@starting-style`), so it works where scripts are disabled, such as the VSCode preview. The dialog `id` is a stable hash of the image `src`, so repeated references to the same image share one dialog; an author `{#id}` (via attrs) overrides it; images inside links are left untouched. The markdown-it and rehype plugins emit identical HTML.
