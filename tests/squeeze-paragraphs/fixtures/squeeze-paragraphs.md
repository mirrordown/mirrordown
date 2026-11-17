<!-- @case: non-empty paragraph is untouched -->

Just some text.

<!-- @case: multiple non-empty paragraphs are untouched -->

First paragraph.

Second paragraph.

<!-- @case: paragraph with only an image is not empty -->

![alt](img.png) inline

<!-- @case: paragraph with emphasis is not empty -->

Some *emphasized* text.

<!-- @case: heading and paragraph are untouched -->

# Title

Body.

<!-- @case: paragraph of only a space character reference is removed -->

Before.

&#32;

After.

<!-- @case: emptied blockquote is kept without its paragraph -->

> &#32;

<!-- @case: whitespace-only paragraph inside a loose list item is removed -->

- First.

  &#32;

  Second.

<!-- @case: adjacent whitespace-only paragraphs are all removed -->

&#32;

&#9;

Text.
