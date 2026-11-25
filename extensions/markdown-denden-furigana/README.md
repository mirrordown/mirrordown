# Markdown DenDen Furigana

Adds DenDenMarkdown furigana &lt;ruby&gt; support to VSCode's markdown preview.

## Overview

The `ruby` plugin renders `{base|reading}` as HTML `<ruby>` annotations, used for pronunciation guides in East Asian text.

```html
<ruby>base<rt>reading</rt></ruby>
```

## Syntax

Use `{base text|reading}` inline to annotate characters with their pronunciation or reading:

````markdown
{漢字|かんじ} are Chinese-derived characters used in Japanese writing.

{東京|とうきょう} is the capital of Japan.
````

A ruby is written on one line, and its first `|` splits it: the base holds no `{`, `}` or `|` (though it may start with `{`), and the reading runs to the next `}`. Spaces and tabs around the base and around the reading are dropped. A brace group without a `|`, such as an attribute block (`{.class}`), is never a ruby, and a ruby written right after one still is. A base or a reading left empty (`{|reading}`, `{base|}`) is not a ruby either. Write `\{` to keep a brace literal. In a table cell, write the separator as `\|`.

The base and the reading are inline markup, so formatting and links work inside them, and so does what the other inline plugins read (`{--a--|==b==}`). Because the first `|` is always the separator, braces around a [spoiler](/guide/plugins/spoiler) are today read as a ruby: `{note: ||secret||}` renders `note:` with `|secret||` printed above it.

Optionally pass `rp`, a pair of parentheses to wrap the reading in `<rp>` elements, for browsers that don't support ruby. Every engine takes the option: `.use(remarkRuby, { rp: ["(", ")"] })`, `md.use(ruby, { rp: ["(", ")"] })` and `satteriRuby({ rp: ["(", ")"] })`.

```html
<ruby>漢字<rp>(</rp><rt>かんじ</rt><rp>)</rp></ruby>
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-ruby`](https://www.npmjs.com/package/@mirrordown/mdit-ruby) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
