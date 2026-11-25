# Markdown Sectionize

Wraps headings and their content in &lt;section&gt; elements in VSCode's markdown preview.

## Overview

The `sectionize` plugin wraps every heading — together with all the content that follows it, up to the next heading of equal or shallower depth — in a semantic `<section>` element. Deeper headings nest inside the sections of their shallower ancestors, mirroring the document outline. Each section carries a `data-depth` attribute equal to the rank of its heading (`1`–`6`), so sections can be targeted with CSS or scripting.

Content that appears before the first heading stays unwrapped. Only headings at the top level of the document are wrapped: one inside a blockquote or a list item is left as it is.

**Before:**
```html
<h2>Install</h2>
<p>Run the installer.</p>
<h3>Requirements</h3>
<p>Node 24+.</p>
```

**After:**
```html
<section data-depth="2">
  <h2>Install</h2>
  <p>Run the installer.</p>
  <section data-depth="3">
    <h3>Requirements</h3>
    <p>Node 24+.</p>
  </section>
</section>
```

## Syntax

There is no special syntax — write ordinary headings and the plugin builds the section structure from the heading outline:

````markdown
# Getting Started

Some introduction text.

## Installation

Steps to install.

## Configuration

How to configure it.
````

Skipped heading levels are handled gracefully: an `<h3>` directly under an `<h1>` nests as `data-depth="3"` inside the `<h1>`'s section, with no intervening `<h2>` section invented. Heading order does not matter either: a heading that comes before a shallower one (an `<h4>` followed by an `<h2>`) still gets its own section, which ends where the shallower heading begins.

[!TIP]
`sectionize` only wraps — it never touches heading ids, and `slug` finds the nested headings whichever of the two is listed first. List it **before** `autolink-headings`, though: with `behavior: "before"` or `"after"` (or `group`) that plugin adds an element next to the heading, and that element has to be created inside the heading's section. Listed after `autolink-headings`, the remark and Sätteri plugins leave it outside the section.

[!NOTE]
Raw HTML is opaque to `sectionize`: a heading written as an HTML tag is not sectioned, and a markdown heading between a raw opening tag and its closing tag (a `<div>` and `</div>` on their own lines, say) opens a section that runs past the closing tag.

With GFM footnotes, remark and Sätteri add the footnotes at the end of the document as a `<section data-footnotes>` of their own, and today it lands inside the last heading's section.

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-sectionize`](https://www.npmjs.com/package/@mirrordown/mdit-sectionize) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
