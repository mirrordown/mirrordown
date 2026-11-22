<!-- @case: a step title of one image is kept -->

@1. ![a](a.png)
>  body

<!-- @case: a step title of several images is kept -->

@1. ![a](a.png) ![b](b.png)
>  body

<!-- @case: an image paragraph in a step's body is unwrapped -->

@1. Step
>  ![a](a.png)

<!-- @case: an alert title of one image is kept -->

> [!note] ![a](a.png)
> body

<!-- @case: an alert title of several images is kept -->

> [!note] ![a](a.png) ![b](b.png)
> body

<!-- @case: an image paragraph in an alert's body is unwrapped -->

> [!note]
> ![a](a.png)

<!-- @case: a lightbox dialog's caption of one image is kept -->

!![a](a.png)
~: ![c](c.png)

<!-- @case: a lightbox dialog's caption of several images is kept -->

!![a](a.png)
~: ![c](c.png) ![d](d.png)
