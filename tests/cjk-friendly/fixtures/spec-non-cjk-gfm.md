<!-- The CommonMark CJK-friendly Amendments test corpus: testcases/gfm-non-cjk.md of https://github.com/tats-u/markdown-cjk-friendly at e7bad674ba512a396b95db23c11c9206291eca99, one paragraph per case. MIT licensed: see LICENSE.md in this folder. -->

<!-- @case: gfm-non-cjk 01 -->
~~Hi~~ Hello, ~there~ world!

<!-- @case: gfm-non-cjk 02 -->
This ~~has a

<!-- @case: gfm-non-cjk 03 -->
new paragraph~~.

<!-- @case: gfm-non-cjk 05 -->
A proper ~strikethrough~.

<!-- @case: gfm-non-cjk 06 -->
These are ~not strikethroughs.

<!-- @case: gfm-non-cjk 07 -->
No, they are not~

<!-- @case: gfm-non-cjk 08 -->
This ~is ~ legit~ isn't ~ legit.

<!-- @case: gfm-non-cjk 11 -->
No ~mismatch~~

<!-- @case: gfm-non-cjk 12 -->
~~**_`this`_**~~  
~~***`this`***~~  
~~___`this`___~~

<!-- @case: gfm-non-cjk 13 -->
~~**_this_**~~  
~~***this***~~  
~~___this___~~

<!-- @case: gfm-non-cjk 14 -->
~Hi~ Hello, world!

<!-- @case: gfm-non-cjk 16 -->
[^~~is~~1]

<!-- @case: gfm-non-cjk 17 -->
a~~()a~~a

<!-- @case: gfm-non-cjk 18 -->
a~~a()~~a

<!-- @case: gfm-non-cjk 19 -->
~~()~~

<!-- @case: gfm-non-cjk 20 -->
(~~()~~)
