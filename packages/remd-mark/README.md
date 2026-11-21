# @mirrordown/remd-mark

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A remark/rehype (unified) plugin for the `mark` syntax extension.

## Overview

The `mark` plugin renders `==text==` as an HTML `<mark>` element, representing highlighted or marked text. A highlight that starts with a colour emoji (`==🔴text==`) is coloured, as in Obsidian.

```html
<mark>text</mark>
```

## Syntax

Wrap text in double equals signs to highlight it:

````markdown
==This text is highlighted.==

You can use it inline: remember to ==save your work== before closing.
````

A delimiter needs text right against it, as emphasis does: an opening `==` can't be followed by a space and a closing one can't follow a space, so `a == b == c` stays as written. Of a run of three, one equals sign stays outside (`===a===` is a highlight between two equals signs). A highlight can run over a line break, not over a blank line. A URL written bare in the text is read like any other text, also where GFM makes it a link (`https://example.com/a==b==c` highlights the `b`): write it as an autolink (`<https://…>`) or as a link's target to keep it whole.

A backslash keeps a delimiter literal (`\==not highlighted==`), and so does writing an equals sign as a character reference (`&#61;`). Highlights nest up to 100 deep; the markers of deeper ones stay text. An attribute block written right after a highlight (`==text=={.name}`) goes on the `<mark>`, with the [`attrs`](/guide/plugins/attrs) plugin or Sätteri's `attributes` feature on. A few things differ between the engines:

- Spans have to nest. When a span crosses another one or crosses emphasis (`==a *b== c*`, `==a --b== c--`), each engine resolves it its own way, and in remark and Sätteri the result depends on the order the plugins are listed in.
- In image alt text (`![==a==](x.png)`), markdown-it drops the equals signs and remark and Sätteri keep the text as written.
- The remark plugin reads escapes from the source, so it needs the file: `processor.runSync(tree)` on a tree alone treats `\==` as `==`.

### Highlight colours

Start a highlight with a colour emoji to colour it, as Obsidian does. The emoji is removed, and the highlight gets a `data-highlight` attribute naming the colour:

````markdown
==🔴Red== ==🟠Orange== ==🟡Yellow== ==🟢Green== ==🔵Blue== ==🟣Purple==
````

```html
<mark data-highlight="red">Red</mark>
```

Each colour has a circle and a square, and the squares work as well as the circles:

| Colour | Circle | Square |
| --- | --- | --- |
| `red` | 🔴 | 🟥 |
| `orange` | 🟠 | 🟧 |
| `yellow` | 🟡 | 🟨 |
| `green` | 🟢 | 🟩 |
| `blue` | 🔵 | 🟦 |
| `purple` | 🟣 | 🟪 |

The emoji has to touch the opening `==` and be the first thing in the highlight: `==te🔴xt==` and `==**🔴bold**==` have no colour and keep the emoji as text, and `== 🔴 text==` is not a highlight at all, since an opening `==` can't be followed by a space. Only the emoji goes: a space after it stays in the highlight (`==🟠 text==` highlights ` text`), and so does anything else, a second emoji included. A highlight that is only an emoji (`==🔴==`) is empty. An emoji written as a character reference (`&#x1F534;`) is text, as an escaped delimiter is. To a delimiter the emoji is punctuation, so `word==🔴text==` is not a highlight, as `word==*text==` is not: put a space before it. A highlight without an emoji is unchanged and has no `data-highlight`. Nested highlights each take the colour of their own first character, and one that starts with another highlight has no colour of its own. An attribute block (`==🔴text=={.note}`) adds its attributes after the colour, and a `data-highlight` written in the block replaces the emoji's.

Without the stylesheet a coloured highlight looks like a plain one: the colour is only an attribute until something styles it. Import the stylesheet, as the usage examples below do. It styles the six colours and nothing else, so a plain `<mark>` keeps the browser's own style, and all of it sits inside `@layer markdown-mark`, so your own unlayered CSS overrides it without `!important`. Each colour is a translucent tint behind text that keeps its own colour, and it follows the nearest `color-scheme`: set `color-scheme: light dark` on `:root` for the dark tints. Override a colour with its custom property, `--markdown-mark-red`, `--markdown-mark-orange`, `--markdown-mark-yellow`, `--markdown-mark-green`, `--markdown-mark-blue` or `--markdown-mark-purple`, on `:root` or any ancestor. Each falls back on its own, and an invalid value keeps that colour's default:

```css
:root {
  --markdown-mark-red: oklch(0.7 0.2 25 / 40%);
  --markdown-mark-blue: light-dark(oklch(0.85 0.1 255 / 50%), oklch(0.5 0.15 255 / 50%));
}
```

## Install

Import the stylesheet if you use highlight colours.

```sh
npm install @mirrordown/remd-mark
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkMark } from "@mirrordown/remd-mark";
import "@mirrordown/remd-mark/mark.css";

const processor = unified()
  .use(remarkParse)
  .use(remarkMark)
  .use(remarkRehype)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkMark } from "@mirrordown/remd-mark";
import "@mirrordown/remd-mark/mark.css";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMark],
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
