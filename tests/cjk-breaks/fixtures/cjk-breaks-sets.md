<!-- @case: a highlight is transparent -->

==日本==
語

日本
==語==

<!-- @case: an insertion and a deletion are transparent -->

++日本++
語

--日本--
語

<!-- @case: a spoiler is transparent -->

||日本||
語

日本
||語||

<!-- @case: subscript and superscript are transparent -->

H~日本~
語

x^日本^
語

<!-- @case: a key is transparent -->

[[日本]]
語

<!-- @case: a ruby is read by its base text, not its reading -->

{漢字|kanji}
日本

日本
{kanji|漢字}

<!-- @case: a tag is transparent -->

#タグ
続き

<!-- @case: an abbreviation is transparent -->

*[東大]: 東京大学

東大
です

<!-- @case: a break inside a highlight -->

==日本
語==

<!-- @case: an alert's body -->

> [!NOTE]
> 日本
> 語

<!-- @case: an alert's title is its own line -->

> [!TIP] 題名
> 本文
> です

<!-- @case: a tab panel -->

% タブ
> 日本
> 語

<!-- @case: a step body -->

@1. 手順
> 日本
> 語

<!-- @case: a definition -->

用語
: 日本
  語

<!-- @case: a caption -->

![](x.png)
~: 日本
語

<!-- @case: a table caption across rows -->

| a |
| - |
| b |
~: 日本
語

<!-- @case: a task list item -->

- [ ] 日本
  語

<!-- @case: a block id after the last line -->

日本
語 ^name

<!-- @case: an attribute block after the last line -->

日本
語
{.note}

<!-- @case: an attribute block at the end of the last line -->

日本
語 {#name .note}

<!-- @case: a span's attribute block is not between it and the break -->

==日本=={.x}
語

**日本**{.x}
語

<!-- @case: a setext heading's id is read without the break -->

日本
語
===
