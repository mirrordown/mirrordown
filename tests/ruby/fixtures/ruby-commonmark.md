<!-- @case: basic whole-text -->

{ruby base|ruby text}

<!-- @case: emphasis in base -->

{*word*|reading}

<!-- @case: emphasis in reading -->

{word|*reading*}

<!-- @case: emphasis wrapping whole ruby -->

*{word|reading}*

<!-- @case: inline context -->

Before {word|read} after.

<!-- @case: multiple ruby in paragraph -->

{A|a} and {B|b}.

<!-- @case: strong in base -->

{**word**|reading}

<!-- @case: strong in reading -->

{word|**reading**}

<!-- @case: code span in base -->

{`code`|reading}

<!-- @case: code span in reading -->

{word|`reading`}

<!-- @case: multiple inline in base -->

{*a* and *b*|reading}

<!-- @case: in heading -->

## {word|reading}

<!-- @case: in blockquote -->

> {word|reading}

<!-- @case: no pipe - not matched -->

{no pipe here}
