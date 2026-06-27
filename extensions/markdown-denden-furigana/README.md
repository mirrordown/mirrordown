# Markdown DenDen Furigana

Adds DenDenMarkdown furigana &lt;ruby&gt; support to VSCode's markdown preview.

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

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-ruby`](https://www.npmjs.com/package/@mirrordown/mdit-ruby) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
