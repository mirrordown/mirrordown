<!-- @case: basic word -->

[[Ctrl]]

<!-- @case: start of sentence -->

[[Ctrl]] to copy

<!-- @case: end of sentence -->

press [[Ctrl]]

<!-- @case: middle of sentence -->

press [[Ctrl]] to copy

<!-- @case: multiple keys -->

[[Ctrl]] + [[C]]

<!-- @case: key combination -->

[[Ctrl+C]]

<!-- @case: adjacent to word chars -->

foo[[Bar]]baz

<!-- @case: empty kbd -->

[[]]

<!-- @case: wrapping emphasis -->

[[_italic_]]

<!-- @case: wrapping strong -->

[[**bold**]]

<!-- @case: inside emphasis -->

_press [[Ctrl]]_

<!-- @case: inside strong -->

**press [[Ctrl]]**

<!-- @case: in heading -->

## [[Ctrl]]

<!-- @case: in list items -->

- [[Ctrl]]
- [[Alt]]

<!-- @case: in blockquote -->

> press [[Enter]]

<!-- @case: no match - single bracket -->

[Ctrl]

<!-- @case: mixed inline content -->

[[**Ctrl**+C]]

<!-- @case: unclosed opening -->

press [[ key

<!-- @case: escaped opening delimiter is literal -->

\[[text]]

<!-- @case: escaped closing delimiter is literal -->

[[text\]]

<!-- @case: escaped backslash keeps the delimiter -->

\\[[text]]

<!-- @case: keys nest -->

[[a [[b]] c]]

<!-- @case: a single closing bracket stays in the key -->

[[a]b]]

<!-- @case: a line ending inside formatting still ends the attempt -->

[[*a*
b]]

<!-- @case: an extra opening bracket stays outside the key -->

[[[a]]
