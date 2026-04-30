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
