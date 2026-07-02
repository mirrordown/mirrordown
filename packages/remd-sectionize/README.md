# @mirrordown/remd-sectionize

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `sectionize` syntax extension.

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

[!NOTE]
This is a rehype plugin (`rehype-*`), not a remark plugin. Add it **after** `remarkRehype` in your pipeline.

## Install

```sh
npm install @mirrordown/remd-sectionize
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeSectionize } from "@mirrordown/remd-sectionize";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSectionize)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { rehypeSectionize } from "@mirrordown/remd-sectionize";

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeSectionize]
  }
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { rehypeSectionize } from "@mirrordown/remd-sectionize";

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeSectionize]
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
