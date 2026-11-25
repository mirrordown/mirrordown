# @mirrordown/mdit-cjk-friendly

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A markdown-it plugin for the `cjk-friendly` syntax extension.

## Overview

CommonMark decides whether `**` opens or closes from the characters on either side of it, and it expects a space where a sentence puts one. Chinese and Japanese put no space between words, and their punctuation is full-width, so in CommonMark this stays as written:

```markdown
**テスト。**テスト
```

```html
<p>**テスト。**テスト</p>
```

The closing `**` follows punctuation (`。`) and comes before a letter (`テ`), which in English is the start of a word, not the end of one. The `cjk-friendly` plugin applies the [CommonMark CJK-friendly Amendments](https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md), the specification written for [CommonMark issue #650](https://github.com/commonmark/commonmark-spec/issues/650) that Comrak, pulldown-cmark, goldmark, Markdig and GitLab follow too:

```html
<p><strong>テスト。</strong>テスト</p>
```

It has no syntax and no options: it changes when a delimiter run opens and closes, and only where a CJK character is beside it.

> [!NOTE]
> The examples show their Markdown and the HTML that markdown-it and remark render. Mirrordown's documentation site renders with Sätteri, which does not have the rule yet (see [Engines](#engines)), so a live demo there would show CommonMark's output.

## The rule

A run of delimiters (`*`, `_`, `~~`, and Mirrordown's own) opens when it is left-flanking and closes when it is right-flanking. CommonMark says a run is left-flanking unless whitespace follows it, or punctuation follows it while a letter precedes it; right-flanking is the mirror image. The amendment adds one thing: when the punctuation on one side is CJK punctuation, or the character on either side is a CJK character, the run flanks both ways.

A CJK character is one that East Asian Width calls wide, fullwidth or halfwidth and that is not an emoji, or any Hangul: ideographs, kana, Hangul, CJK punctuation such as `。`, `「` and `（`, and fullwidth forms. Whitespace comes first, so the ideographic space U+3000 is whitespace beside a run, as in CommonMark.

```markdown
**テスト。**テスト

これは**「重要」**です

**이름(Name)**은 필수입니다

他说**“你好”**然后走了
```

```html
<p><strong>テスト。</strong>テスト</p>
<p>これは<strong>「重要」</strong>です</p>
<p><strong>이름(Name)</strong>은 필수입니다</p>
<p>他说<strong>“你好”</strong>然后走了</p>
```

In the last two, the punctuation beside the run is not CJK (`)` and `“`), but the character on its other side is.

What stays as it was:

- **Underscores inside a word.** `これは__重要__です` stays text: a `_` run that is both left- and right-flanking opens only after punctuation and closes only before it, CJK or not, which keeps `snake_case_names` intact.
- **Emoji.** They are wide, but they are not CJK characters: a run beside one flanks as in CommonMark.
- **Text with no CJK character beside a delimiter.** It renders exactly as before, with one exception the specification makes on purpose: a variation selector (U+FE00 to U+FE0E) belongs to the character before it, so punctuation followed by one is read as punctuation, where CommonMark read the selector as a letter. `**a.︀**a` (a full stop, U+FE00) is bold in CommonMark and stays as written with this plugin, as `**a.**a` does in both. In remark there is a second: micromark's own emphasis and strikethrough read a character outside the Basic Multilingual Plane as two code units, which they take for a letter, and with this plugin remark reads it whole, as CommonMark defines it and as markdown-it, Sätteri and `remark-cjk-friendly` do. So an emoji or a mathematical symbol (Unicode P or S) beside a `*`, `_` or `~~` run is punctuation: `a**a𝜵**a` was bold in remark alone and stays as written with this plugin, and `🎉**"a"**` is bold.

The specification reads variation selectors throughout: `。︀` is still CJK punctuation, an ideograph with an ideographic variation selector (`葛󠄀`) is still an ideograph, and the quotation marks `“ ” ‘ ’` followed by U+FE01, which asks for their full-width form, count as CJK punctuation.

## Other delimiters

Every delimiter that flanks like emphasis takes the same rule: GFM strikethrough (`~~`), and Mirrordown's [`mark`](/guide/plugins/mark) (`==`), [`ins`](/guide/plugins/ins) (`++`), [`del`](/guide/plugins/del) (`--`), [`spoiler`](/guide/plugins/spoiler) (`||`), [`sub`](/guide/plugins/sub) (`~`) and [`sup`](/guide/plugins/sup) (`^`).

```markdown
~~削除。~~テスト

==強調。==テスト

これは==「重要」==です

これは~「下付き」~と^「上付き」^です
```

```html
<p><del>削除。</del>テスト</p>
<p><mark>強調。</mark>テスト</p>
<p>これは<mark>「重要」</mark>です</p>
<p>これは<sub>「下付き」</sub>と<sup>「上付き」</sup>です</p>
```

markdown-it writes strikethrough as `<s>`, as it always does. Without this plugin, Mirrordown's delimiters flank as CommonMark says, in every engine.

## Engines

The rule is one function in `@mirrordown/core`, which both plugins call:

- **markdown-it.** The plugin overrides `scanDelims` on the instance it is used on, the method emphasis, strikethrough and every Mirrordown delimiter plugin ask, and changes its answer only where the amendment changes CommonMark's. It keeps what other overrides decide, such as `mdit-sub`'s rule that `*` flanks a `~`, whichever is added first.
- **remark.** The plugin replaces micromark's emphasis tokenizer and, when `remark-gfm` is in the processor, runs GFM's strikethrough tokenizer and classifies its runs by the rule. It also tells the Mirrordown plugins of the same processor to use the rule. None of this depends on order: list it before or after `remark-gfm` and the Mirrordown plugins.
- **Sätteri.** Not yet. Sätteri parses emphasis in its Rust parser, where a plugin cannot reach, and the rule is planned there as an optional feature, as pulldown-cmark has it. Until then Sätteri renders `**テスト。**テスト` as written, and the Mirrordown Sätteri plugins (`==`, `++`, `--`, `||`) keep CommonMark's rule, so they agree with Sätteri's own emphasis. The presets for markdown-it and remark have the rule on; the Sätteri preset has no `cjkFriendly` option.

Each engine keeps its own idea of whitespace and punctuation, and the amendment only adds its CJK clauses to it, but for the one thing above: remark reads a character outside the Basic Multilingual Plane beside a run whole, as markdown-it does. So the other differences the engines have without the plugin stay:

- micromark lets a `*` run flank a `_` and a `_` run flank a `*` (`a*_b_*` is nested emphasis in remark), and keeps doing so. `remark-cjk-friendly` drops that rule.
- remark builds `==`, `++`, `--` and `||` after micromark has paired emphasis and `~`, so a span of ours that crosses one of those resolves differently from markdown-it, which pairs them all together.
- A variation selector right after a NUL (`a\0︀**"b"**`) belongs to U+FFFD in markdown-it, which has replaced the NUL in its text, and to nothing in remark, where micromark keeps the NUL apart; the two reference packages differ the same way.

## Install

```sh
npm install @mirrordown/mdit-cjk-friendly
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { cjkFriendly } from "@mirrordown/mdit-cjk-friendly";

// Before or after the other plugins: the order doesn't matter.
const md = new MarkdownIt().use(cjkFriendly);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { cjkFriendly } from "@mirrordown/mdit-cjk-friendly";

export default defineConfig({
  markdown: {
    config: (md) => md.use(cjkFriendly),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
