<!-- basic del wrapping a single word -->

--Delete--

<!-- del at the start of a sentence, followed by plain text -->

--Delete me-- and leave me

<!-- del at the end of a sentence, preceded by plain text -->

leave me and --Delete me--

<!-- del in the middle of a sentence with text on both sides -->

leave me and --Delete me-- and leave me

<!-- multiple del instances in one paragraph -->

--first deleted-- and --second deleted--

<!-- non-matching: spaces around the dashes prevent del from forming -->

foo -- bar -- baz

<!-- del adjacent to word characters without surrounding spaces -->

foo--bar--baz

<!-- del wrapping strong emphasis -->

--**bold deleted**--

<!-- del wrapping regular emphasis -->

--_italic deleted_--

<!-- del nested inside strong emphasis -->

**--deleted inside bold--**

<!-- del nested inside regular emphasis -->

_--deleted inside italic--_

<!-- del in a heading -->

## --Deleted heading--

<!-- del in list items -->

- --first item--
- --second item--

<!-- del in a blockquote -->

> --blockquote content--

<!-- del wrapping mixed inline content spanning strong and plain text -->

--**bold** and regular--
