---
title: mark
description: Adds highlight syntax using ==double equals==.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `mark` plugin renders `==text==` as an HTML `<mark>` element, representing highlighted or marked text. A highlight that starts with a marker emoji gets a variant: a colour, as in Obsidian (`==🔴text==`), or a label (`==🐛 Bug==`), which the stylesheet draws as a pill.

```html
<mark>text</mark>
```

## Syntax

Wrap text in double equals signs to highlight it:

% Demo
> ==This text is highlighted.==
>
> You can use it inline: remember to ==save your work== before closing.
% Code
> ````markdown
> ==This text is highlighted.==
>
> You can use it inline: remember to ==save your work== before closing.
> ````

A delimiter needs text right against it, as emphasis does: an opening `==` can't be followed by a space and a closing one can't follow a space, so `a == b == c` stays as written. Of a run of three, one equals sign stays outside (`===a===` is a highlight between two equals signs). A highlight can run over a line break, not over a blank line. A URL written bare in the text is read like any other text, also where GFM makes it a link (`https://example.com/a==b==c` highlights the `b`): write it as an autolink (`<https://…>`) or as a link's target to keep it whole.

A backslash keeps a delimiter literal (`\==not highlighted==`), and so does writing an equals sign as a character reference (`&#61;`). Highlights nest up to 100 deep; the markers of deeper ones stay text. An attribute block written right after a highlight (`==text=={.name}`) goes on the `<mark>`, with the [`attrs`](/guide/plugins/attrs) plugin or Sätteri's `attributes` feature on. A few things differ between the engines:

- Spans have to nest. When a span crosses another one or crosses emphasis (`==a *b== c*`, `==a --b== c--`), each engine resolves it its own way, and in remark and Sätteri the result depends on the order the plugins are listed in.
- In image alt text (`![==a==](x.png)`), markdown-it drops the equals signs and remark and Sätteri keep the text as written.
- The remark plugin reads escapes from the source, so it needs the file: `processor.runSync(tree)` on a tree alone treats `\==` as `==`.

### Colours and labels

Start a highlight with a marker emoji to give it a variant, named in a `data-highlight` attribute. A colour emoji is removed, as Obsidian does with its highlight colours:

% Demo
> ==🔴Red== ==🟠Orange== ==🟡Yellow== ==🟢Green== ==🔵Blue== ==🟣Purple==
% Code
> ````markdown
> ==🔴Red== ==🟠Orange== ==🟡Yellow== ==🟢Green== ==🔵Blue== ==🟣Purple==
> ````

```html
<mark data-highlight="red">Red</mark>
```

A label's emoji stays in the highlight, so it reads as a badge. The labels are GitHub's nine default issue labels and a warning:

% Demo
> ==🐛 Bug== ==📖 Documentation== ==✨ Enhancement== ==❓ Question== ==🙋 Help wanted== ==🌱 Good first issue== ==👯 Duplicate== ==🚫 Invalid== ==⛔ Won't fix== ==⚠️ Warning==
% Code
> ````markdown
> ==🐛 Bug== ==📖 Documentation== ==✨ Enhancement== ==❓ Question== ==🙋 Help wanted== ==🌱 Good first issue== ==👯 Duplicate== ==🚫 Invalid== ==⛔ Won't fix== ==⚠️ Warning==
> ````

```html
<mark data-highlight="bug">🐛 Bug</mark>
```

| Marker | Variant | Emoji |
| --- | --- | --- |
| 🔴 🟥 | `red` | removed |
| 🟠 🟧 | `orange` | removed |
| 🟡 🟨 | `yellow` | removed |
| 🟢 🟩 | `green` | removed |
| 🔵 🟦 | `blue` | removed |
| 🟣 🟪 | `purple` | removed |
| 🐛 | `bug` | kept |
| 📖 | `documentation` | kept |
| ✨ | `enhancement` | kept |
| ❓ | `question` | kept |
| 🙋 | `help-wanted` | kept |
| 🌱 | `good-first-issue` | kept |
| 👯 | `duplicate` | kept |
| 🚫 | `invalid` | kept |
| ⛔ | `wontfix` | kept |
| ⚠️ | `warning` | kept |

Each colour has a circle and a square, and the squares work as well as the circles. With the stylesheet, every highlight that has a variant is drawn as a pill, and a plain highlight is not: `==text==` keeps the browser's own style. A label keeps its emoji so that one variant can be told from another without seeing its colour. A colour loses its emoji, as in Obsidian, so its colour is all that tells it apart: use a label where the difference matters to every reader.

The emoji has to touch the opening `==` and be the first thing in the highlight: `==te🔴xt==` and `==**🔴bold**==` have no variant and keep the emoji as text, and `== 🔴 text==` is not a highlight at all, since an opening `==` can't be followed by a space. Only a colour's emoji goes: a space after it stays in the highlight (`==🟠 text==` highlights ` text`, which the pill doesn't show), and so does anything else, a second emoji included. A highlight that is only a colour emoji (`==🔴==`) is empty. A variation selector (U+FE0F) doesn't count when markers are compared, so `⚠` and `⚠️` are the same marker. An emoji written as a character reference (`&#x1F534;`) is text, as an escaped delimiter is. To a delimiter the emoji is punctuation, so `word==🔴text==` is not a highlight, as `word==*text==` is not: put a space before it. A highlight without a marker is unchanged and has no `data-highlight`. Nested highlights each take the variant of their own first character, and one that starts with another highlight has none of its own. An attribute block (`==🔴text=={.note}`) adds its attributes after the variant, and a `data-highlight` written in the block replaces the emoji's.

Without the stylesheet a highlight with a variant looks like a plain one: the variant is only an attribute until something styles it. Import the stylesheet, as the usage examples below do. All of it sits inside `@layer markdown-mark`, so your own unlayered CSS overrides it without `!important`. A pill is drawn from one colour: a pale tint of it behind a deep shade of it, or a dark tint behind a light shade when the nearest `color-scheme` is dark (set `color-scheme: light dark` on `:root` for that). For every default, text on its pill has a contrast ratio of at least 4.5:1 in both schemes.

Override a default's colour with its custom property, `--markdown-mark-` followed by the variant's name (`--markdown-mark-red`, `--markdown-mark-bug`, `--markdown-mark-help-wanted`, and so on), on `:root` or any ancestor. The tint and the text are both mixed from that one colour, so give it a mid-tone one. Each falls back on its own, and an invalid value keeps that variant's default:

```css
:root {
  --markdown-mark-red: oklch(0.55 0.22 25);
  --markdown-mark-bug: oklch(0.6 0.2 5);
}
```

## Configuration

### Markers

The `markers` option adds markers, renames the default ones and turns them off. It is merged over the defaults, and each value is one of:

- a variant name, with the emoji kept: `"release"`;
- `{ name, keep }`, where `keep: false` removes the emoji from the highlight (`keep` is `true` unless set);
- `false`, which turns a default off, so its emoji is text again.

A variant name is letters, digits, `_` and `-`. A marker is one or more characters with no whitespace: an emoji, a sequence joined by zero-width joiners (`👩‍💻`), a flag (`🇯🇵`), or text. Markers are compared without variation selectors, so `{ "⚠": false }` turns off the default `⚠️`. When two markers match, the longest wins. The plugin throws when it is created if a name or a marker breaks these rules. The presets take the same option as `mark: { markers }`.

Add a marker, so `==🚀 v2.0==` renders `<mark data-highlight="release">🚀 v2.0</mark>`:

% Remark
> ```ts
> remarkMark({ markers: { "🚀": "release" } })
> ```
% Markdown-It
> ```ts
> md.use(mark, { markers: { "🚀": "release" } })
> ```
% Sätteri
> ```ts
> satteriMark({ markers: { "🚀": "release" } })
> ```

Hide its emoji, so `==🚀 v2.0==` renders `<mark data-highlight="release"> v2.0</mark>`:

% Remark
> ```ts
> remarkMark({ markers: { "🚀": { name: "release", keep: false } } })
> ```
% Markdown-It
> ```ts
> md.use(mark, { markers: { "🚀": { name: "release", keep: false } } })
> ```
% Sätteri
> ```ts
> satteriMark({ markers: { "🚀": { name: "release", keep: false } } })
> ```

Turn a default off, so `==🐛 Bug==` is a plain highlight again:

% Remark
> ```ts
> remarkMark({ markers: { "🐛": false } })
> ```
% Markdown-It
> ```ts
> md.use(mark, { markers: { "🐛": false } })
> ```
% Sätteri
> ```ts
> satteriMark({ markers: { "🐛": false } })
> ```

### Colour a variant of your own

The stylesheet draws a variant it doesn't know as a grey pill. Give it a colour with one declaration of `--markdown-mark-color` on its selector; an invalid value keeps the grey:

```css
mark[data-highlight="release"] {
  --markdown-mark-color: oklch(0.6 0.15 300);
}
```

## Usage

% Remark
> Import the stylesheet to draw colours and labels as pills.
>
> ```sh
> npm install @mirrordown/remd-mark
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkMark } from "@mirrordown/remd-mark";
> import "@mirrordown/remd-mark/mark.css";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkMark)
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkMark } from "@mirrordown/remd-mark";
> import "@mirrordown/remd-mark/mark.css";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkMark],
>   },
> });
> ```
% Markdown-It
> Import the stylesheet to draw colours and labels as pills.
>
> ```sh
> npm install @mirrordown/mdit-mark
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { mark } from "@mirrordown/mdit-mark";
> import "@mirrordown/mdit-mark/styles";
>
> const md = new MarkdownIt().use(mark);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { mark } from "@mirrordown/mdit-mark";
> import "@mirrordown/mdit-mark/styles";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(mark),
>   },
> });
> ```
% Sätteri
> Import the stylesheet to draw colours and labels as pills.
>
> ```sh
> npm install @mirrordown/sat-mark
> ```
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriMark } from "@mirrordown/sat-mark";
> import "@mirrordown/sat-mark/mark.css";
>
> const { html } = markdownToHtml(source, {
>   mdastPlugins: [satteriMark()],
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriMark } from "@mirrordown/sat-mark";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ mdastPlugins: [satteriMark()] }),
>   },
> });
>
> // In your layout:
> import "@mirrordown/sat-mark/mark.css";
> ```
