<!-- @case: no images -->

Plain text paragraph with no images.

<!-- @case: non-svg image -->

![logo](./fixtures/logo.png)

<!-- @case: external svg url -->

![icon](https://example.com/icon.svg)

<!-- @case: simple inline -->

![](./fixtures/circle.inline.svg)

<!-- @case: with alt text -->

![Inline SVG](./fixtures/circle.inline.svg)

<!-- @case: utf-8 path -->

![一](./fixtures/一.svg)

<!-- @case: same svg twice -->

![icon](./fixtures/flower.svg)

![icon](./fixtures/flower.svg)

<!-- @case: typical document -->

# Hello

This is a test markdown document.

![Inline SVG](./fixtures/circle.inline.svg)

Cheers

<!-- @case: alt text with replacement patterns stays literal -->

![Price: $1 $& $$5](./fixtures/circle.inline.svg)

<!-- @case: self-closing root keeps its closing slash after the label -->

a ![alt](./fixtures/test.svg) b
