<!-- @case: a tag in a table cell -->

| #head | Name |
| ----- | ---- |
| #first | text #after |
| `#code` | [#link](url) |

<!-- @case: a tag after an escaped pipe in a table cell -->

| Cell |
| ---- |
| #a\|b and \|#c |

<!-- @case: a bare url with a fragment is never a tag -->

https://example.com/#fragment and www.example.com/#frag

<!-- @case: a tag beside a bare url -->

#before https://example.com #after
