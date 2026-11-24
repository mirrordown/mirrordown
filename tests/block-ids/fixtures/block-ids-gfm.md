<!-- @case: a marker in a table cell is text -->

| a ^x |
| --- |
| b ^y |

<!-- @case: a marker alone after a table names the table -->

| x |
| --- |

^b

<!-- @case: a marker alone after a table with rows names the table -->

| x | y |
| --- | --- |
| 1 | 2 |

^table-id

<!-- @case: a marker on a line after a table's last row is a row -->

| x |
| --- |
^row
