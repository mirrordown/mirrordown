<!-- @case: basic word -->

==Mark==

<!-- @case: start of sentence -->

==Mark me== and leave me

<!-- @case: end of sentence -->

leave me and ==Mark me==

<!-- @case: middle of sentence -->

leave me and ==Mark me== and leave me

<!-- @case: multiple marks -->

==first marked== and ==second marked==

<!-- @case: equality operator -->

if a == b then c == d

<!-- @case: adjacent to word chars -->

foo==bar==baz

<!-- @case: wrapping strong -->

==**bold marked**==

<!-- @case: wrapping emphasis -->

==_italic marked_==

<!-- @case: inside strong -->

**==marked inside bold==**

<!-- @case: inside emphasis -->

_==marked inside italic==_

<!-- @case: in heading -->

## ==Marked heading==

<!-- @case: in list items -->

- ==first item==
- ==second item==

<!-- @case: in blockquote -->

> ==blockquote content==

<!-- @case: mixed inline content -->

==**bold** and regular==
