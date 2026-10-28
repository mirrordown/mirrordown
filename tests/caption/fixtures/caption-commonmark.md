<!-- @case: image: an image alone is the figure's content -->

![A lighthouse](lighthouse.jpg)
~: The lighthouse at dusk.

<!-- @case: image: the caption holds inline markdown -->

![A lighthouse](lighthouse.jpg)
~: The *Point Reyes* light, `1870`, from [the park](https://www.nps.gov/pore/).

<!-- @case: image: an image in a link -->

[![A lighthouse](lighthouse.jpg)](lighthouse-large.jpg)
~: Select the image for a larger one.

<!-- @case: image: several images make one figure -->

![First](a.jpg) ![Second](b.jpg)
~: Two views of the same coast.

<!-- @case: image: an image in a sentence captions the paragraph -->

The coast ![a lighthouse](lighthouse.jpg) at dusk.
~: An image inside a sentence isn't a figure of its own.

<!-- @case: image: text before the image captions the paragraph -->

Before the image:
![A lighthouse](lighthouse.jpg)
~: The caption covers the whole paragraph.

<!-- @case: image: the caption runs to the end of its paragraph -->

![A lighthouse](lighthouse.jpg)
~: The first line of the caption,
and the second,
and the third.

<!-- @case: image: a hard break before the caption -->

![A lighthouse](lighthouse.jpg)\
~: After a hard break.

<!-- @case: image: a later marker is caption text -->

![A lighthouse](lighthouse.jpg)
~: The first caption
~: is all one caption.

<!-- @case: paragraph: text paragraph -->

I wandered lonely as a cloud
That floats on high o'er vales and hills,
~: William Wordsworth, *Daffodils*

<!-- @case: blockquote: a caption outside the quote captions it -->

> Do or do not. There is no try.
~: A little green man, with a saber larger than himself

<!-- @case: blockquote: a caption inside the quote captions its paragraph -->

> Do or do not. There is no try.
> ~: Inside the quote

<!-- @case: blockquote: each level captions its own quote -->

> > Inner quote
> > continued
> ~: The inner quote's caption
>
> More of the outer quote
~: The outer quote's caption

<!-- @case: blockquote: lines of the same level continue the caption -->

> > Inner
> ~: The inner caption
> still the inner caption
~: The outer caption

<!-- @case: blockquote: a caption after a quote ending in a list -->

> - One
> - Two
~: The caption goes on the quote

<!-- @case: blockquote: a caption after a quote ending in code -->

> ```
> code
> ```
~: The caption goes on the quote

<!-- @case: blockquote: code in a quote with a caption inside -->

> ```
> code
> ```
> ~: The caption goes on the code

<!-- @case: code: fenced -->

```python
a_highlighted_code("blah")
```
~: My code *caption*

<!-- @case: code: tilde fence -->

~~~
code
~~~
~: A caption after a tilde fence

<!-- @case: code: indented -->

Indented:

    indented code
~: A caption after indented code

<!-- @case: list: a caption outside the list captions it -->

- One
- Two
~: The list's caption

<!-- @case: list: ordered -->

1. One
2. Two
~: An ordered list's caption

<!-- @case: list: loose -->

- One

- Two
~: A loose list's caption

<!-- @case: list: a caption inside an item captions its paragraph -->

- One
  ~: The item's caption
- Two

<!-- @case: list: a caption outside nested lists captions the outermost -->

- One
  - Nested
~: The outer list's caption

<!-- @case: list: a caption in an item captions its nested list -->

- One
  - Nested
  ~: The nested list's caption

<!-- @case: untouched: after a blank line -->

```
code
```

~: Not a caption

<!-- @case: untouched: after a heading -->

# A heading
~: Not a caption

<!-- @case: untouched: after a thematic break -->

***
~: Not a caption

<!-- @case: untouched: after a link reference definition -->

```
code
```
[home]: https://example.com
~: Not a caption

<!-- @case: untouched: first in the document -->

~: Not a caption

<!-- @case: untouched: escaped marker -->

![A lighthouse](lighthouse.jpg)
\~: Not a caption

<!-- @case: untouched: no space after the marker -->

![A lighthouse](lighthouse.jpg)
~:Not a caption

<!-- @case: untouched: nothing after the marker -->

![A lighthouse](lighthouse.jpg)
~:

<!-- @case: untouched: the marker mid-line -->

![A lighthouse](lighthouse.jpg) ~: Not a caption

<!-- @case: untouched: a caption after a caption -->

```
code
```
~: The caption

~: Not a caption
