# @saeris/mdit-ruby

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A markdown-it plugin for the `ruby` syntax extension.

## Overview

The `ruby` plugin renders `{base|reading}` as HTML `<ruby>` annotations, used for pronunciation guides in East Asian text.

```html
<ruby>base<rt>reading</rt></ruby>
```

## Syntax

Use `{base text|reading}` inline to annotate characters with their pronunciation or reading:

```markdown
{漢字|かんじ} are Chinese-derived characters used in Japanese writing.

{東京|とうきょう} is the capital of Japan.
```

Optionally pass `rp` parentheses for fallback rendering in unsupported browsers:

## Usage

## Install

```sh
npm install @saeris/mdit-ruby
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { ruby } from "@saeris/mdit-ruby";

const md = new MarkdownIt().use(ruby);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { ruby } from "@saeris/mdit-ruby";

export default defineConfig({
  markdown: {
    config: (md) => md.use(ruby)
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/ruby](https://saeris.github.io/markdown/guide/plugins/ruby)

## License

MIT © [Drake Costa](https://saeris.gg)
