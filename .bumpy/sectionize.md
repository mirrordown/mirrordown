---
"@mirrordown/mdit-sectionize": minor
"@mirrordown/remd-sectionize": minor
"markdown-sectionize": minor
"markdown-preview-extended-syntax": patch
---

Add the sectionize plugin set: wraps each heading and the content beneath it — up to the next heading of equal or shallower depth — in a semantic `<section data-depth="N">` element, nesting deeper headings inside their ancestors' sections to mirror the document outline. Skipped heading levels nest gracefully (an `<h3>` under an `<h1>` becomes `data-depth="3"` with no invented `<h2>` section) and content before the first heading stays unwrapped. It only wraps and never touches heading ids, so it composes with `slug`/`autolink-headings` when run first. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-sectionize` VSCode preview extension in the extension pack.
