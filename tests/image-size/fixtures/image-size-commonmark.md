<!-- @case: a width and a height after the alt text -->

![Engelbart|100x145](https://example.com/e.jpg)

<!-- @case: a width alone after the alt text -->

![Engelbart|100](https://example.com/e.jpg)

<!-- @case: a description that is only a width leaves an empty alt -->

![250](https://example.com/e.jpg)

<!-- @case: a description that is only a width and a height leaves an empty alt -->

![250x100](https://example.com/e.jpg)

<!-- @case: a description without a size is left as it is -->

![Engelbart](e.jpg) ![a|b](e.jpg) ![a|](e.jpg) ![|](e.jpg)

<!-- @case: five digits are a size, six are not -->

![a|99999x99999](e.jpg) ![a|123456](e.jpg) ![a|100x123456](e.jpg)

<!-- @case: a unit or a percentage is not a size -->

![a|100px](e.jpg) ![a|50%](e.jpg)

<!-- @case: a height alone is not a size -->

![a|x145](e.jpg)

<!-- @case: an upper-case X is not a size -->

![a|100X145](e.jpg)

<!-- @case: a number starting with 0 is not a size -->

![a|0](e.jpg) ![a|0100](e.jpg) ![a|100x0](e.jpg) ![a|100x0145](e.jpg)

<!-- @case: an x without a height is not a size -->

![a|100x](e.jpg)

<!-- @case: spaces inside the size make it not a size -->

![a|100 x 145](e.jpg) ![a| 100](e.jpg)

<!-- @case: a size followed by a space is not a size -->

![a|100 ](e.jpg)

<!-- @case: digits that are not ASCII are not a size -->

![a|١٠٠](e.jpg) ![a|１００](e.jpg)

<!-- @case: three numbers are not a size -->

![a|1x2x3](e.jpg)

<!-- @case: the whitespace before the bar leaves the alt text -->

![Engelbart   |100](e.jpg) ![Engelbart	|100](e.jpg)

<!-- @case: the whitespace at the start of the alt text stays -->

![  a|100](e.jpg)

<!-- @case: only the last bar is read -->

![a|b|100](e.jpg) ![a|100|200](e.jpg)

<!-- @case: a bar with nothing before it leaves an empty alt -->

![|100](e.jpg) ![ |100](e.jpg)

<!-- @case: formatting in the description is its text -->

![*Engel* **bart**|100](e.jpg)

<!-- @case: a code span in the description is its text -->

![`Engelbart`|100](e.jpg)

<!-- @case: a bar inside a code span is still the bar -->

![a`|100`](e.jpg)

<!-- @case: a character reference before the size is text -->

![Tom &amp; Jerry|100](e.jpg)

<!-- @case: a character reference in place of the bar is the bar -->

![a&#124;100](e.jpg)

<!-- @case: an escaped bar is the bar -->

![a\|100](e.jpg)

<!-- @case: a character reference in place of the x is the x -->

![a|100&#120;145](e.jpg)

<!-- @case: replacement patterns in the alt text are kept as written -->

![$& $1 $$|100](e.jpg)

<!-- @case: names of object members in the alt text are kept as written -->

![\_\_proto\_\_|100](e.jpg) ![constructor|100](e.jpg) ![toString|100](e.jpg)

<!-- @case: an image with a title -->

![Engelbart|100x145](e.jpg "A portrait")

<!-- @case: a full reference image finds its definition by its label -->

![Engelbart|100x145][e]

[e]: e.jpg "A portrait"

<!-- @case: a collapsed reference image finds its definition by the description as written -->

![Engelbart|100][]

[Engelbart|100]: e.jpg

<!-- @case: a shortcut reference image finds its definition by the description as written -->

![Engelbart|100]

[Engelbart|100]: e.jpg

<!-- @case: an image inside a link -->

[![Engelbart|100](e.jpg)](https://example.com)

<!-- @case: a link with a size in its text is not an image -->

[Engelbart|100](https://example.com)

<!-- @case: an image in a list item -->

- ![Engelbart|100](e.jpg)
- text ![Engelbart|100x145](e.jpg)

<!-- @case: an image in a blockquote -->

> ![Engelbart|100](e.jpg)

<!-- @case: an image in a heading -->

# A portrait ![Engelbart|100](e.jpg)

<!-- @case: two sized images in one paragraph -->

![a|100](a.jpg) and ![b|200x50](b.jpg)

<!-- @case: a sized image after text and before text -->

Before ![a|100](a.jpg) after.

<!-- @case: an empty description -->

![](e.jpg)

<!-- @case: a description of only spaces -->

![   ](e.jpg)

<!-- @case: a description over two lines -->

![Engel
bart|100](e.jpg)

<!-- @case: a hard line break in the description is not part of the alt text -->

![Engel\
bart|100](e.jpg)
