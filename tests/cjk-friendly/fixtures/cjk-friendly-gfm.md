<!-- @case: strikethrough closing after CJK punctuation -->
~~削除。~~テスト

<!-- @case: strikethrough around a CJK bracket -->
これは~~「削除」~~です

<!-- @case: strikethrough with no CJK character beside it, as before -->
~~a.~~b and ~~a~~b

<!-- @case: strikethrough around strong, closing before CJK text -->
~~**削除。**~~テスト

<!-- @case: strikethrough reads an astral symbol whole -->
🎉~~"a"~~ and a~~a𝜵~~a

<!-- @case: in a table cell -->
| 列 |
| --- |
| **テスト。**テスト |
| ~~削除。~~テスト |
