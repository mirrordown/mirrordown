<!-- @case: table: the caption row is the caption -->

head1 | head2
----- | -----
bla   | bla
~: A table caption

<!-- @case: table: the caption runs to the end of the table -->

head1 | head2
----- | -----
bla   | bla
~: The first line of the caption,
and the second.

<!-- @case: table: the caption holds inline markdown -->

| Name | Value |
| ---- | ----- |
| one  |     1 |
~: Values, *rounded*

<!-- @case: table: a caption with only a header -->

| Name | Value |
| ---- | ----- |
~: Just the header

<!-- @case: table: a row starting with the marker in a cell isn't a caption -->

| Name | Value |
| ---- | ----- |
| ~: one | 1 |
