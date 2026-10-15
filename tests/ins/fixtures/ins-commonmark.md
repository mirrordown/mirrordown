<!-- @case: basic word -->

++Insert++

<!-- @case: start of sentence -->

++Insert me++ and leave me

<!-- @case: end of sentence -->

leave me and ++Insert me++

<!-- @case: middle of sentence -->

leave me and ++Insert me++ and leave me

<!-- @case: multiple ins -->

++first inserted++ and ++second inserted++

<!-- @case: spaces prevent match -->

foo ++ bar ++ baz

<!-- @case: adjacent to word chars -->

foo++bar++baz

<!-- @case: wrapping strong -->

++**bold inserted**++

<!-- @case: wrapping emphasis -->

++_italic inserted_++

<!-- @case: inside strong -->

**++inserted inside bold++**

<!-- @case: inside emphasis -->

_++inserted inside italic++_

<!-- @case: in heading -->

## ++Inserted heading++

<!-- @case: in list items -->

- ++first item++
- ++second item++

<!-- @case: in blockquote -->

> ++blockquote content++

<!-- @case: mixed inline content -->

++**bold** and regular++

<!-- @case: empty ins -->

++++

<!-- @case: unclosed opening -->

foo ++bar

<!-- @case: escaped opening delimiter is literal -->

\++text++

<!-- @case: escaped closing delimiter is literal -->

++text\++

<!-- @case: escaped backslash keeps the delimiter -->

\\++text++

<!-- @case: an odd-length run leaves its extra marker outside the span -->

+++a+++

<!-- @case: a closer pairs with the nearest opener -->

++a ++b++

<!-- @case: spans nest -->

++a ++b++ c++

<!-- @case: a run between spaces neither opens nor closes -->

++a +++ b++
