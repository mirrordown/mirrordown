<!-- @case: in table cell -->

| Before | After  |
| ------ | ------ |
| ^sup^  | normal |

<!-- @case: escaped pipe inside a superscript stays in the cell -->

| ^a\|b^ | x |
| ------ | - |
| ^c\|d^ | y |

<!-- @case: delimiters do not pair across table cells -->

| a^b | c^d |
| --- | --- |
| e^f | g^h |

<!-- @case: undefined footnote reference opens a superscript with footnotes on -->

[^1] x^2^
