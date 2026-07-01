<!-- @case: basic word -->

||spoiler||

<!-- @case: start of sentence -->

||the butler|| did it

<!-- @case: end of sentence -->

the killer was ||the butler||

<!-- @case: middle of sentence -->

the killer was ||the butler|| all along

<!-- @case: multiple spoilers -->

||first secret|| and ||second secret||

<!-- @case: lone pipe -->

a | b then c | d

<!-- @case: adjacent to word chars -->

foo||bar||baz

<!-- @case: wrapping strong -->

||**bold spoiler**||

<!-- @case: wrapping emphasis -->

||_italic spoiler_||

<!-- @case: inside strong -->

**||spoiler inside bold||**

<!-- @case: inside emphasis -->

_||spoiler inside italic||_

<!-- @case: in heading -->

## ||spoiler heading||

<!-- @case: in list items -->

- ||first item||
- ||second item||

<!-- @case: in blockquote -->

> ||blockquote content||

<!-- @case: mixed inline content -->

||**bold** and regular||

<!-- @case: wrapping a link -->

||see [the reveal](https://example.com) here||

<!-- @case: inside a link -->

[||spoiler in link||](https://example.com)

<!-- @case: wrapping an image -->

||![hidden art](reveal.jpg)||

<!-- @case: image with surrounding text -->

behold ||![hidden art](reveal.jpg)|| the reveal

<!-- @case: image mixed with text inside -->

||caption then ![hidden art](reveal.jpg) after||

<!-- @case: wrapping inline code -->

||`secret_value`||

<!-- @case: multiple inline children -->

||has `code` and **bold** and _italic_||

<!-- @case: empty spoiler -->

||||

<!-- @case: unclosed opening -->

foo ||bar

<!-- @case: leading space not a spoiler -->

|| leading space||
