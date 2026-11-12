# @mirrordown/sat-abbr

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `abbr` syntax extension.

## Overview

The `abbr` plugin lets you define abbreviations once and automatically wraps each place the term stands as a word of its own in an `<abbr>` element with a `title` attribute for the full expansion.

```html
<abbr title="HyperText Markup Language">HTML</abbr>
```

## Syntax

Define abbreviations using the `*[ABBR]: Full text` syntax, before or after the text that uses them. Definitions are removed from the output and matching words are wrapped automatically.

````markdown
*[HTML]: HyperText Markup Language
*[CSS]: Cascading Style Sheets

Write HTML and CSS as normal — they are automatically expanded with tooltips.
````

Write definitions in a paragraph of their own, one per line, with a blank line before and after. A definition can come after the places that use its term, and the first definition of a term wins.

The title is the rest of the line exactly as written: formatting, character references and backslashes in it are not read. The space around the term and around the title is dropped, and a line that leaves either one blank is ordinary text. A backslash puts a bracket in a term (`*[a\]b]: …`), and a backslash before the asterisk (`\*[HTML]: …`) keeps the whole line as text.

A term is marked where it stands as a word of its own: with the start or end of the text, a space, a line ending, punctuation, or one of `$ + < = > ^ | ~` and the backtick on each side. So `HTML` is marked in `(HTML)`, `HTML-5` and `foo_HTML`, and not in `HTML5`, `HTMLé` or `HTML™`. A term can start or end with any character (`C++`, `.NET`, `日本`), terms are case-sensitive, and where two terms start at the same place the longer one wins. Code and image alt text are left alone. A term is looked for in plain text only, so one that holds inline syntax is defined and never marked: after `*[H~2~O]: water` with the sub plugin on, `H~2~O` is a subscript and not an abbreviation.

A few things differ between the engines:

- markdown-it also takes a definition line written directly against other text, with no blank line between them: a line of a paragraph, the line before a setext underline or before an own-line attribute block (`{.name}`), the line right under an alert's marker. remark and Sätteri show that line as text.
- markdown-it takes its list of punctuation characters from its own tables, and remark and Sätteri take theirs from the JavaScript runtime, so a punctuation character added to Unicode recently can end a word in one and not in the other.
- The remark plugin reads definitions from the source, so it needs the file: with `processor.runSync(tree)` on a tree alone it reads each paragraph's text instead, where a title holding formatting is not a definition.
- In remark, list `remarkAbbr` after the ruby, attrs and alerts plugins, and in Sätteri list `satteriAbbr()` after the ruby and alerts plugins, as the presets do. Listed before them, a term is marked inside an attribute block (`{.HTML}` then stays text in remark), an alert whose keyword is a term (`> [!NOTE]` with `*[NOTE]: …`) stays a blockquote, and a ruby loses the abbreviations inside it in remark and is not read at all in Sätteri. In markdown-it the order doesn't matter.

## Install

```sh
npm install @mirrordown/sat-abbr
```

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriAbbr } from "@mirrordown/sat-abbr";

const { html } = markdownToHtml(source, {
  mdastPlugins: [satteriAbbr()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriAbbr } from "@mirrordown/sat-abbr";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriAbbr()] }),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
