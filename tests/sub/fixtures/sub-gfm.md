<!-- @case: in table cell -->

| Before | After  |
| ------ | ------ |
| ~sub~  | normal |

<!-- @case: emphasis opens against a subscript inside a word -->

x*~i~*

<!-- @case: strong wraps a subscript inside a word -->

H**~2~**O

<!-- @case: emphasis closes against a subscript before a letter -->

*a~b~*c

<!-- @case: emphasis and strong together wrap a subscript inside a word -->

x***~i~***

<!-- @case: emphasis beside a subscript inside a link label -->

[x*~i~*](u)

<!-- @case: underscores beside a subscript inside a word stay literal -->

x_~i~_

<!-- @case: a tilde that opens no subscript lets emphasis flank it the same way -->

x*~ y*

<!-- @case: an escaped tilde lets emphasis close against it the same way -->

*a\~*c
