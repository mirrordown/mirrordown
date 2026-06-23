# @saeris/mdit-definition-list

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A markdown-it plugin for the `definition-list` syntax extension.

## Overview

The `definition-list` plugin renders Pandoc-style definition lists as HTML `<dl>`, `<dt>`, and `<dd>` elements.

```html
<dl>
  <dt>Term</dt>
  <dd>Definition</dd>
</dl>
```

## Syntax

Write a term on one line, then follow it with one or more definitions prefixed by `: ` or `~ `:

```markdown
Apple
: A round fruit with red or green skin.
: Also a technology company.

Orange
: A citrus fruit with orange skin.

Multiple terms can share definitions:

HTTP
HTTPS
: Protocols for transferring data on the web.
```

## Usage

## Install

```sh
npm install @saeris/mdit-definition-list
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { definitionList } from "@saeris/mdit-definition-list";

const md = new MarkdownIt().use(definitionList);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { definitionList } from "@saeris/mdit-definition-list";

export default defineConfig({
  markdown: {
    config: (md) => md.use(definitionList)
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/definition-list](https://saeris.github.io/markdown/guide/plugins/definition-list)

## License

MIT © [Drake Costa](https://saeris.gg)
