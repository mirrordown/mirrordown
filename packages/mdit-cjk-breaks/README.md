# @mirrordown/mdit-cjk-breaks

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A markdown-it plugin for the `cjk-breaks` syntax extension.

## Overview

Authors wrap long paragraphs in their editor, and a line break in the source becomes a space in the page. Between English words that space belongs there. Chinese and Japanese are written without spaces between words, so the same break puts a space in the middle of a sentence. The `cjk-breaks` plugin removes a soft line break between two Chinese or Japanese characters, so the sentence reads as it was written.

**Markdown:**
```markdown
吾輩は猫である。
名前はまだ無い。
```

**HTML:**
```html
<p>吾輩は猫である。名前はまだ無い。</p>
```

Without the plugin the line break stays in the HTML, and the browser shows it as a space. CSS Text Level 3 tells browsers to drop such a break ([segment break transformation](https://www.w3.org/TR/css-text-3/#line-break-transform)), and Chromium does not: `日本語⏎日本語` measures as wide as `日本語 日本語`. So the plugin removes the break from the HTML itself. There are no options, no stylesheet and no script.

````markdown
吾輩は猫である。
名前はまだ無い。
どこで生れたか
とんと見当がつかぬ。
````

## The rule

For each soft line break, the plugin looks at the character before it and the character after it:

1. If either is the zero-width space U+200B, the break is removed and the zero-width space stays.
2. Otherwise, if both have the [East Asian Width](https://www.unicode.org/reports/tr11/) W (wide), F (fullwidth) or H (halfwidth), and neither is Hangul, the break is removed.
3. Otherwise the break stays.

This is the rule of CSS Text Level 3, and the one [markdown-it-cjk-breaks](https://github.com/markdown-it/markdown-it-cjk-breaks) implements. Ideographs, kana, CJK punctuation such as `。` and `，`, fullwidth forms such as `Ａ` and halfwidth katakana such as `ｶ` are wide. Latin letters, digits, spaces, and punctuation whose width is ambiguous, such as `“` and `±`, are not. The widths and the Hangul script come from Unicode 18, from the tables every Mirrordown plugin reads, so the three engines agree whatever Unicode version the runtime ships.

A removed break is removed, not replaced: no space and no zero-width character takes its place.

````markdown
中文的句子，
换行也不会多出空格。

「かぎかっこ」
も同じです。

ＡＢＣ
ＤＥＦ
````

**Emoji.** The rule reads East Asian Width alone, as CSS and the reference plugin do, so an emoji that is wide counts as wide: `🎉⏎日本語` loses its break, and so does `日本語⏎🎉`. An emoji that is not wide, such as `☺`, keeps it.

**Characters outside the Basic Multilingual Plane,** such as `𠮷`, are read whole. An ideographic variation selector is a character of its own: in `葛󠄀⏎飾区` the character before the break is the selector after `葛`, whose width is ambiguous, so the break stays.

## The character the reader sees

The character on each side of a break is the one the reader sees next to it, which is what CSS Text Level 3 looks at:

- **Inline markup that wraps text is read through:** emphasis, strong, links and strikethrough, and the spans of the other Mirrordown sets: highlights, insertions, deletions, spoilers, subscript, superscript, keys, tags and abbreviations. In `**日本**⏎**語**` the break stands between `本` and `語`, and goes.
- **A ruby is read by its base text,** not its reading, which sits above the line: `{漢字|kanji}⏎日本` loses its break.
- **A code span counts by its own content.** `` `コード`⏎日本語 `` loses its break, between `ド` and `日`. `` 日本語`foo`⏎日本語 `` keeps it: the character before the break is the `o` of `foo`.
- **Anything else is not a character,** and the break beside it stays: an image, raw HTML, a hard break, a footnote reference, and whatever a plugin this one doesn't know makes. `日本語![](x.png)⏎日本語` keeps its break.
- **The start and the end of a block are not characters either.**

````markdown
**日本**
**語**

`コード`
日本語

日本語`foo`
日本語

==強調==
と[[Ctrl]]
と{漢字|かんじ}
です。
````

## What it leaves alone

- **Korean.** Korean puts spaces between words, as English does, so a break next to a Hangul character stays, on either side.
- **A break beside Latin text,** which is a word space: `日本語⏎English` and `English⏎日本語` keep theirs.
- **Hard breaks.** Two spaces or a backslash at the end of a line make a `<br>`, which the plugin never touches.
- **Code and attributes.** A line ending inside a code span, a code block, raw HTML, a link's title or an image's description is not a soft break, and stays as it is.

````markdown
한국어 문장은
띄어쓰기를 합니다.

日本語
English

日本語␠␠
日本語
````

(`␠␠` stands for the two spaces that end the line.)

A document with no soft break between two wide characters comes out exactly as it does without the plugin.

## Inside containers

A paragraph in a list item, a quote, an alert, a tab panel, a step body, a definition or a caption is a paragraph like any other, and a table caption written across rows is one caption.

````markdown
> [!NOTE]
> アラートの
> 本文です。

- 箇条書きの
  項目です。
````

## Plugin order

Several sets find their syntax by the lines of a paragraph: tabs and steps find a header by its line, an alert's title is the rest of its marker's line, a tag and an abbreviation end at a line ending, and a caption is found by its line in the source. A removed break is a line they no longer see. And a span built after the break was decided is markup the plugin never read through. markdown-it has parsed every span and read every container before any rule at the end of its core chain runs, so the plugin goes last:

- **remark and Sätteri:** list it after every other mdast plugin. Listed before github-alerts, `> [!NOTE] タイトル⏎> 本文です` would title the alert `タイトル本文です`; listed before mark, `==日本==⏎語` would keep its break.
- **markdown-it:** its rule goes at the end of the core chain, after every rule that reads a block's lines wherever those are added, except mdit-caption's, which goes at the end too and joins a table caption's rows with soft breaks. Add it after mdit-caption. It never leaves a paragraph empty, so mdit-squeeze-paragraphs can stay the last rule.

The presets list it in this place.

## Engine notes

- **A tab at the end of a line.** markdown-it keeps a tab before a line ending in the text (as commonmark.js does), and remark and Sätteri drop it (as micromark does), so `日本語⇥⏎日本語` keeps its break in markdown-it, where the character before it is the tab, and loses it in the other two. Without the plugin the engines already differ by that tab.
- **`breaks: true` in markdown-it** turns every line break into a `<br>`. Each is then a hard break, and the plugin leaves them all.
- **Footnotes.** markdown-it reads no footnotes without a plugin; in remark with GFM and in Sätteri a footnote reference is not a character.
- **Escapes.** In remark and Sätteri the plugin rebuilds the text of a paragraph it removes a break from, and records which characters were escaped (`\*`) or written as character references, so a plugin listed after it still reads them as text. remark's plugin needs the file's value for this, as `process` gives it.

## Differences from markdown-it-cjk-breaks

The reference walks to the nearest text token on each side of a break and steps over everything between, stopping at an empty one. So it removes the break in `` 日本語`foo`⏎日本語 `` (reading past the code span to `日`) and in `日本語![](x.png)⏎日本語` (past the image), and keeps it in `` `コード`⏎日本語 `` and in `**日本**⏎**語**` (at the empty text token emphasis leaves beside its markup). Nothing else differs: the two read the same width on every character. The options its forks add, removing a break when either side is wide and adding a space after punctuation, are not part of this plugin.

## Install

```sh
npm install @mirrordown/mdit-cjk-breaks
```

Its rule goes at the end of markdown-it's core chain. Add it after mdit-caption, which puts its rule there too.

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { cjkBreaks } from "@mirrordown/mdit-cjk-breaks";

const md = new MarkdownIt().use(cjkBreaks);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { cjkBreaks } from "@mirrordown/mdit-cjk-breaks";

export default defineConfig({
  markdown: {
    config: (md) => md.use(cjkBreaks),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
