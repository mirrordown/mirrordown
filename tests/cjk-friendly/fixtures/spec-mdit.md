<!-- Cases of the CommonMark CJK-friendly Amendments test corpus (https://github.com/tats-u/markdown-cjk-friendly at e7bad674ba512a396b95db23c11c9206291eca99, MIT licensed: see LICENSE.md in this folder) that markdown-it and remark render differently with or without cjk-friendly: the engines' own differences, each pinned per engine. -->

<!-- @case: gfm-non-cjk 04 -->
This will ~~~not~~~ strike.

<!-- @case: gfm-non-cjk 09 -->
This is not ~~~~~one~~~~~ huge strikethrough.

<!-- @case: gfm-non-cjk 10 -->
~one~ ~~two~~ ~~~three~~~

<!-- @case: gfm-non-cjk 15 -->
This ~text~ ~~is~~ ~~~curious~~~.

<!-- @case: gfm-non-cjk 21 -->
| A |
| - |
| https://example.com/ |
