<!-- @case: rule 1: an attribute block's id and class go on the paragraph's one image -->

![a](pic.png)
{#hero .wide}

<!-- @case: rule 1: a marker ending the image's line names the image -->

![a](pic.png) ^img

<!-- @case: rule 1: a marker alone in the next paragraph names the image -->

![a](pic.png)

^img

<!-- @case: rule 1: every attribute moves, not only the id -->

![a](pic.png)
{.wide data-k=v style="color:red"}

<!-- @case: rule 1: a class alone moves -->

![a](pic.png)
{.wide}

<!-- @case: rule 1: a data attribute alone moves -->

![a](pic.png)
{data-k=v}

<!-- @case: rule 1: a style alone moves -->

![a](pic.png)
{style="color:red"}

<!-- @case: rule 1: a linked image takes the id, not the link -->

[![a](pic.png)](https://example.com)
{#hero}

<!-- @case: rule 1: a linked image named by a marker takes the id, not the link -->

[![a](pic.png)](https://example.com) ^img

<!-- @case: rule 1 and rule 6: a lightbox image takes the attributes, not its button, and the dialog's copy takes none -->

!![a](pic.png)
{#hero .wide}

<!-- @case: rule 1 and rule 6: a lightbox image named by a marker is the one element with the id -->

!![a](pic.png) ^img

<!-- @case: rule 6: a lightbox image's own id names its dialog and the paragraph's goes on the image -->

!![a](pic.png){#own}
{#hero}

<!-- @case: rule 2: the image's own id wins over the paragraph's -->

![a](pic.png){#own}
{#hero}

<!-- @case: rule 2: the image's own id wins over a marker's -->

![a](pic.png){#own} ^img

<!-- @case: rule 2: the image's own class comes first and the paragraph's follows -->

![a](pic.png){.c}
{.wide}

<!-- @case: rule 2: an own id and class, with the brief's example -->

![a](pic.png){#own .c}
{#x .wide}

<!-- @case: rule 2: classes join without duplicates -->

![a](pic.png){.c .wide}
{.wide .d}

<!-- @case: rule 2: the image's own value of any attribute wins -->

![a](pic.png){data-k=own}
{data-k=para}

<!-- @case: rule 2: the image's own title wins -->

![a](pic.png "own title")
{title=para}

<!-- @case: rule 5: size attributes keep their place and the paragraph's follow in its order -->

![a](pic.png){width=10 height=20}
{#x .wide}

<!-- @case: rule 5: a joined class keeps the image's place for it, among the size attributes -->

![a](pic.png "own title"){.c width=10 height=20}
{#x .wide data-k=v}

<!-- @case: rule 5: the paragraph's attributes follow in the order they were written -->

![a](pic.png){width=10}
{data-k=v .wide #x}

<!-- @case: rule 3: two images and an id keep the paragraph -->

![a](a.png) ![b](b.png)
{#x .wide}

<!-- @case: rule 3: three images and an id keep the paragraph -->

![a](a.png) ![b](b.png) ![c](c.png)
{#x}

<!-- @case: rule 3: a class on a group of images keeps the paragraph -->

![a](a.png) ![b](b.png)
{.gallery}

<!-- @case: rule 3: two images named by a marker keep the paragraph -->

![a](a.png) ![b](b.png) ^pair

<!-- @case: rule 3: three images named by a marker alone after them keep the paragraph -->

![a](a.png) ![b](b.png) ![c](c.png)

^three

<!-- @case: rule 3: a linked image and a plain one with an id keep the paragraph -->

[![a](a.png)](https://example.com) ![b](b.png)
{#x}

<!-- @case: rule 3: two lightbox images and an id keep the paragraph -->

!![a](a.png) !![b](b.png)
{#x}

<!-- @case: rule 4: two images with no attribute are unwrapped -->

![a](a.png) ![b](b.png)

<!-- @case: rule 4: three images with no attribute are unwrapped -->

![a](a.png) ![b](b.png) ![c](c.png)

<!-- @case: an image with its own attributes and none on the paragraph is unwrapped unchanged -->

![a](pic.png){#own .c}

<!-- @case: caption: a marker ending the caption names the figure, and the image inside is unwrapped -->

![a](pic.png)
~: A caption ^img

<!-- @case: caption: a marker before the caption line is text, so the paragraph keeps it and stays -->

![a](pic.png) ^img
~: A caption

<!-- @case: caption: a caption line after a blank line captions nothing, so the named image is unwrapped with its id -->

![a](pic.png) ^img

~: A caption

<!-- @case: caption: an attribute block ending the caption goes on the figure -->

![a](pic.png)
~: A caption {#fig .wide}

<!-- @case: caption: a marker alone after a figure names the figure -->

![a](pic.png)
~: A caption

^fig

<!-- @case: an escaped marker is text and keeps the paragraph -->

![a](pic.png) \^img

<!-- @case: an escaped attribute block is text and keeps the paragraph -->

![a](pic.png)
\{#hero}

<!-- @case: a character reference for the caret is text and keeps the paragraph -->

![a](pic.png) &#94;img

<!-- @case: a marker in a code span is code and keeps the paragraph -->

![a](pic.png) `^img`

<!-- @case: a heading is not a paragraph and keeps its id -->

# ![a](pic.png) ^img

<!-- @case: a heading's attribute block stays on the heading -->

# ![a](pic.png) {#x}

<!-- @case: a marker in a tight list item names the item -->

- ![a](pic.png) ^img

<!-- @case: a loose list item's image paragraph gives its id to the image -->

- ![a](pic.png)
  {#x}

- b

<!-- @case: a quoted image paragraph gives its id to the image -->

> ![a](pic.png)
> {#x}

<!-- @case: a marker in a quote names the quote and the image is unwrapped -->

> ![a](pic.png) ^img

<!-- @case: a table cell holds no paragraph -->

| ![a](pic.png){#x} |
| --- |
| ![b](b.png) |

<!-- @case: a marker alone first in the document names nothing -->

^img

![a](pic.png)

<!-- @case: an image paragraph between paragraphs keeps the others as they are -->

Before
{.before}

![a](pic.png)
{#x}

After
{.after}
