<!-- Subscript and superscript together: they nest, and crossing runs resolve leftmost-first (the earliest closer pairs with its nearest opener), as in Sätteri. -->

<!-- @case: superscript inside subscript -->

~a^b^c~

<!-- @case: subscript inside superscript -->

^a~b~c^

<!-- @case: crossing runs: the superscript closes first -->

^foo~bar^baz^bar~foo^

<!-- @case: crossing runs: the subscript closes first -->

~foo^bar~baz~bar^foo~

<!-- @case: an opener inside a closed span cannot pair outside it -->

~a^b~c^
