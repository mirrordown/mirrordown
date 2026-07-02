# Markdown Sectionize

Wraps headings and their content in &lt;section&gt; elements in VSCode's markdown preview.

## Overview

The `sectionize` plugin wraps every heading — together with all the content that follows it, up to the next heading of equal or shallower depth — in a semantic `<section>` element. Deeper headings nest inside the sections of their shallower ancestors, mirroring the document outline. Each section carries a `data-depth` attribute equal to the rank of its heading (`1`–`6`), so sections can be targeted with CSS or scripting.

Content that appears before the first heading stays unwrapped.

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

```markdown
# Getting Started

Some introduction text.

## Installation

Steps to install.

## Configuration

How to configure it.
```

Skipped heading levels are handled gracefully: an `<h3>` directly under an `<h1>` nests as `data-depth="3"` inside the `<h1>`'s section, with no intervening `<h2>` section invented.

[!TIP]
`sectionize` only wraps — it never touches heading ids. Run it **before** `slug`/`autolink-headings` so those plugins still add ids to the (now nested) headings.

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-sectionize`](https://www.npmjs.com/package/@mirrordown/mdit-sectionize) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
