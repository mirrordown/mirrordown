<!-- @case: basic word -->

~foo~

<!-- @case: start of sentence -->

~foo~ and more

<!-- @case: end of sentence -->

more and ~foo~

<!-- @case: middle of sentence -->

more and ~foo~ and more

<!-- @case: multiple subs -->

~first~ and ~second~

<!-- @case: chemical formula -->

H~2~O

<!-- @case: adjacent to word chars -->

a~b~c

<!-- @case: other markers in content -->

~foo^bar~baz~bar^foo~

<!-- @case: space after opening prevents match -->

~ foo~

<!-- @case: space before closing prevents match -->

~foo ~

<!-- @case: inside strong -->

**~sub~**

<!-- @case: inside emphasis -->

_~sub~_

<!-- @case: in heading -->

## ~heading~

<!-- @case: in list items -->

- ~first~
- ~second~

<!-- @case: in blockquote -->

> ~content~

<!-- @case: unclosed opening -->

foo ~bar
