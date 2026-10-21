<!-- @case: basic word -->

--Delete--

<!-- @case: start of sentence -->

--Delete me-- and leave me

<!-- @case: end of sentence -->

leave me and --Delete me--

<!-- @case: middle of sentence -->

leave me and --Delete me-- and leave me

<!-- @case: multiple del -->

--first deleted-- and --second deleted--

<!-- @case: spaces prevent match -->

foo -- bar -- baz

<!-- @case: adjacent to word chars -->

foo--bar--baz

<!-- @case: wrapping strong -->

--**bold deleted**--

<!-- @case: wrapping emphasis -->

--_italic deleted_--

<!-- @case: inside strong -->

**--deleted inside bold--**

<!-- @case: inside emphasis -->

_--deleted inside italic--_

<!-- @case: in heading -->

## --Deleted heading--

<!-- @case: in list items -->

- --first item--
- --second item--

<!-- @case: in blockquote -->

> --blockquote content--

<!-- @case: mixed inline content -->

--**bold** and regular--

<!-- @case: unclosed opening -->

foo --bar

<!-- @case: escaped opening delimiter is literal -->

\--text--

<!-- @case: escaped closing delimiter is literal -->

--text\--

<!-- @case: escaped backslash keeps the delimiter -->

\\--text--

<!-- @case: an odd-length run leaves its extra marker outside the span -->

---a---

<!-- @case: a closer pairs with the nearest opener -->

--a --b--

<!-- @case: spans nest -->

--a --b-- c--

<!-- @case: a run between spaces neither opens nor closes -->

--a --- b--
