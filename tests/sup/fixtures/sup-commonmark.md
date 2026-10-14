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
