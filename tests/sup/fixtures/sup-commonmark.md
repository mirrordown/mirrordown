<!-- @case: basic word -->

^foo^

<!-- @case: start of sentence -->

^foo^ and more

<!-- @case: end of sentence -->

more and ^foo^

<!-- @case: middle of sentence -->

more and ^foo^ and more

<!-- @case: multiple sups -->

^first^ and ^second^

<!-- @case: exponent notation -->

E=mc^2^

<!-- @case: adjacent to word chars -->

a^b^c

<!-- @case: other markers in content -->

^foo~bar^baz^bar~foo^

<!-- @case: space after opening prevents match -->

^ foo^

<!-- @case: space before closing prevents match -->

^foo ^

<!-- @case: inside strong -->

**^sup^**

<!-- @case: inside emphasis -->

_^sup^_

<!-- @case: in heading -->

## ^heading^

<!-- @case: in list items -->

- ^first^
- ^second^

<!-- @case: in blockquote -->

> ^content^

<!-- @case: unclosed opening -->

foo ^bar

<!-- @case: escaped opening delimiter is literal -->

\^text^

<!-- @case: escaped closing delimiter is literal -->

^text\^

<!-- @case: escaped backslash keeps the delimiter -->

\\^text^

<!-- @case: space inside the content is allowed -->

^foo bar^

<!-- @case: content is inline markup -->

^*a b* and [c d](e)^

<!-- @case: a run of carets is not a delimiter -->

^^a^

<!-- @case: closes like emphasis: not after punctuation inside a word -->

a^(b)^c

<!-- @case: escaped caret before the opening delimiter stays literal -->

\^^a^

<!-- @case: escaped caret before the closing delimiter is content -->

^a\^^

<!-- @case: escaped caret inside the content is content -->

^a\^b^

<!-- @case: escaped backslash before the closing delimiter keeps it -->

^a\\^

<!-- @case: character reference is not an opening delimiter -->

&#94;a^

<!-- @case: character reference is not a closing delimiter -->

^a&#94;

<!-- @case: character reference does not lengthen a run -->

&#94;^a^

<!-- @case: tab after opening prevents match -->

^	a^

<!-- @case: tab before closing prevents match -->

^a	^

<!-- @case: tab inside the content is allowed -->

^a	b^

<!-- @case: content spans a line ending -->

a ^b
c^ d

<!-- @case: content holds a hard break -->

^a\
b^

<!-- @case: does not span a blank line -->

^a

b^

<!-- @case: link that crosses the closing delimiter wins -->

^a [b^ c](d)

<!-- @case: delimiter inside a link does not pair outside it -->

[a^b](c)^

<!-- @case: brackets that are not a link do not hold a delimiter -->

^a [b^ c] d

<!-- @case: caret in a code span is not a delimiter -->

^a `b^` c^

<!-- @case: carets in a link destination are not delimiters -->

[a](b^c^d)

<!-- @case: image alt text drops the superscript markup -->

![a^b^c](d)

<!-- @case: undefined footnote reference opens a superscript -->

[^1] x^2^

<!-- @case: undefined footnote references with no closer stay literal -->

[^1] and [^2]

<!-- @case: undefined footnote reference after a superscript stays literal -->

x^2^[^1]
