<!-- @case: repeated svg becomes a sprite with use references -->

![icon](./fixtures/flower.svg)

![icon](./fixtures/flower.svg)

<!-- @case: each reference keeps its own alt text -->

![first](./fixtures/flower.svg) and ![second](./fixtures/flower.svg)

<!-- @case: single occurrence is fully inlined -->

![](./fixtures/flower.svg)
