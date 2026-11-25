<!-- @case: a break between two ideographs or kana is removed -->

日本語の文章は
改行しても

<!-- @case: every break of a wrapped paragraph between wide characters is removed -->

吾輩は猫である。
名前はまだ無い。
どこで生れたか
とんと見当がつかぬ。

<!-- @case: a break between CJK and Latin text stays -->

日本語
English

<!-- @case: a break between Latin and CJK text stays -->

English
日本語

<!-- @case: a break between Latin words stays -->

one
two

<!-- @case: Korean keeps its breaks: it puts spaces between words -->

한국어 문장은
띄어쓰기를

<!-- @case: a break next to Hangul stays, on either side -->

漢字
한글

한글
漢字

<!-- @case: halfwidth Hangul is Hangul -->

ﾡ
日本

<!-- @case: wide punctuation is wide -->

中文，
标点

「引用」
です。

<!-- @case: fullwidth forms are wide -->

ＡＢＣ
ＤＥＦ

<!-- @case: halfwidth katakana is wide enough -->

ｶﾀｶﾅ
ｶﾀｶﾅ

<!-- @case: punctuation of ambiguous width is not wide -->

“日本”
日本

日本
“日本”

<!-- @case: a zero-width space before the break removes it, and stays -->

English​
English

<!-- @case: a zero-width space after the break removes it, and stays -->

日本語
​English

<!-- @case: a zero-width space written as a character reference -->

English&#x200B;
English

<!-- @case: a wide emoji is wide: the rule reads East Asian Width alone -->

🎉
日本語

日本語
🎉

<!-- @case: an emoji that is not wide is not -->

☺
日本語

<!-- @case: characters outside the Basic Multilingual Plane -->

𠮷野家
で𠮷

<!-- @case: an ideographic variation selector is the character before the break -->

葛󠄀
飾区

<!-- @case: the ideographic space is wide, and stays -->

日本語　
日本語

<!-- @case: a character reference counts as the character it stands for -->

&#x65E5;
&#x672C;

<!-- @case: escaped characters stay escaped -->

\*日
本\*

<!-- @case: an escaped character next to the break is the character before it -->

日本\*
語

<!-- @case: the spaces around a break are not characters -->

日本語 
   日本語

> 日本語 
>    日本語

<!-- @case: a hard break written with two spaces stays -->

日本語  
日本語

<!-- @case: a hard break written with a backslash stays -->

日本語\
日本語

<!-- @case: a code span counts by its own content -->

`コード`
日本語

日本語
`コード`

<!-- @case: a code span ending in a Latin letter keeps the break -->

日本語`foo`
日本語

日本語
`foo`日本語

<!-- @case: a line ending inside a code span is the code span's -->

`日本
語`

<!-- @case: a fenced code block keeps its lines -->

```
日本
語
```

<!-- @case: an indented code block keeps its lines -->

コード：

    日本
    語

<!-- @case: an image is not a character -->

日本語![](x.png)
日本語

日本語
![](x.png)日本語

<!-- @case: an image's description keeps its line ending -->

![日本
語](x.png)

<!-- @case: a link title keeps its line ending -->

[日本](x "日本
語")

<!-- @case: emphasis is transparent -->

*日本*
語

日本
*語*

<!-- @case: strong emphasis is transparent -->

**日本**
語

日本
**語**

<!-- @case: a break inside emphasis -->

**日本
語**

<!-- @case: nested emphasis is transparent -->

***日本***
語

<!-- @case: a link is transparent -->

[日本](x)
語

日本
[語](x)

<!-- @case: a reference link is transparent -->

[日本][x]
語

[x]: y

<!-- @case: a link with nothing in it is transparent -->

日[](x)
本

<!-- @case: a link around emphasis is transparent -->

[**日本**](x)
語

<!-- @case: an autolink ends in a Latin letter -->

<https://example.com>
日本

<!-- @case: the start of a block is not a character -->

![](x.png)
日本

<!-- @case: a list item -->

- 日本
  語

<!-- @case: a lazy line of a list item -->

- 日本
語

<!-- @case: an ordered list item -->

1. 日本
   語

<!-- @case: a nested list item -->

- 外
  - 日本
    語

<!-- @case: a loose list item -->

- 日本
  語

- 中文
  标点

<!-- @case: a blockquote -->

> 日本
> 語

<!-- @case: a lazy line of a blockquote -->

> 日本
語

<!-- @case: a nested blockquote -->

> > 日本
> > 語

<!-- @case: a setext heading -->

日本
語
===

<!-- @case: an ATX heading has one line -->

# 日本語

日本
語

<!-- @case: a document with no break between wide characters is left as it is -->

Line one
line two, *emphasis*
and `code`.

日本語
English
