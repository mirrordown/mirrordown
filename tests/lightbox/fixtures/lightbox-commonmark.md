<!-- @case: basic opt-in -->

!![Alt text](photo.jpg)

<!-- @case: opt-in with title -->

!![Alt text](photo.jpg "Title text")

<!-- @case: normal image is untouched -->

![Alt text](photo.jpg)

<!-- @case: opt-in mid-paragraph keeps surrounding text -->

See this !![Alt text](photo.jpg) right here.

<!-- @case: distinct images get distinct dialogs -->

!![one](a.jpg) and !![two](b.jpg)

<!-- @case: repeated image shares a single dialog -->

!![first ref](same.jpg) and again !![second ref](same.jpg)

<!-- @case: mixed normal and opt-in -->

![plain](a.jpg) then !![zoom](b.jpg)

<!-- @case: false positive sentence ending in bang -->

Wow! ![Alt text](photo.jpg)

<!-- @case: false positive mid-word bang -->

C++!![Alt text](photo.jpg)

<!-- @case: empty alt -->

!![](photo.jpg)

<!-- @case: scattered across paragraphs collects dialogs at the end -->

First paragraph with !![first](a.jpg) inline.

A second paragraph of plain text in between.

Then !![second](b.jpg) much later in the document.

<!-- @case: reference-style opt-in image -->

!![A wild rice field][rice]

[rice]: photo.jpg

<!-- @case: inside a list item -->

- !![in a list](a.jpg)

<!-- @case: inside a blockquote -->

> !![in a quote](a.jpg)

<!-- @case: inside a link is not lightboxed, marker stays literal -->

[!![linked](a.jpg)](https://example.com)

<!-- @case: nested inside a link is not lightboxed -->

[**!![nested](a.jpg)**](https://example.com)

<!-- @case: inside a reference-style link is not lightboxed -->

[!![ref linked](a.jpg)][site]

[site]: https://example.com
