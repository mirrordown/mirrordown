<!-- @case: a paragraph ending in a footnote reference has no marker -->

text[^1]

[^1]: note

<!-- @case: a marker after a footnote reference names the paragraph -->

text[^1] ^ref

[^1]: note

<!-- @case: a marker at the end of a footnote's definition names its paragraph -->

text[^1]

[^1]: note ^blk

<!-- @case: a marker alone after a footnote's definition names the block before it -->

para

text[^1]

[^1]: note

^after-footnote

<!-- @case: a marker in a task list item names the item -->

- [ ] task ^task
- [x] done

<!-- @case: a marker after a bare URL names the paragraph -->

See https://example.com ^url

<!-- @case: a marker inside strikethrough is text -->

~~^blk~~
