# @mirrordown/remd-squeeze-paragraphs

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `squeeze-paragraphs` syntax extension.

## Overview

The `squeeze-paragraphs` plugin removes paragraphs that are empty or contain only whitespace. A paragraph counts as empty when it has no children, or when every child is whitespace-only text.

CommonMark never emits an empty paragraph on its own, so this plugin does nothing to ordinary hand-written Markdown. Its job is to run **after** other transforms that can leave an empty `<p>` behind — for example a comment stripper that removes a paragraph's only content, or a plugin that lifts an element out of its wrapping paragraph. Adding `squeeze-paragraphs` last tidies up that residue.

**Before** (a prior transform emptied the middle paragraph):

```html
<p>Kept.</p>
<p></p>
<p>Also kept.</p>
```

**After:**

```html
<p>Kept.</p>
<p>Also kept.</p>
```

## Syntax

There is no syntax and no visible change for normal Markdown — paragraphs with real content are always preserved:

```markdown
A paragraph with text.

A paragraph with _emphasis_ and an image ![icon](https://picsum.photos/16/16) is not empty either.
```

[!NOTE]
Because empty paragraphs cannot be written directly in Markdown, the removal behaviour only shows up when another plugin produces one. Place `squeeze-paragraphs` last in your pipeline so it sees that residue.

[!NOTE]
This is a rehype plugin (`rehype-*`), not a remark plugin. Add it **after** `remarkRehype` — and after any plugin whose residue it should clean up.

## Install

```sh
npm install @mirrordown/remd-squeeze-paragraphs
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeSqueezeParagraphs } from "@mirrordown/remd-squeeze-paragraphs";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSqueezeParagraphs)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { rehypeSqueezeParagraphs } from "@mirrordown/remd-squeeze-paragraphs";

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeSqueezeParagraphs]
  }
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { rehypeSqueezeParagraphs } from "@mirrordown/remd-squeeze-paragraphs";

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeSqueezeParagraphs]
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
