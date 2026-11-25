<!-- @case: strong closing after CJK punctuation, at the start of the document -->
**テスト。**テスト

<!-- @case: strong opening before a CJK bracket -->
これは**「重要」**です

<!-- @case: strong closing after an ASCII bracket before Hangul -->
**이름(Name)**은 필수입니다

<!-- @case: strong around quotation marks after a CJK character -->
他说**“你好”**然后走了

<!-- @case: strong between CJK letters, as before -->
これは**重要**です

<!-- @case: double underscore inside CJK text stays text, as before -->
これは__重要__です

<!-- @case: emphasis closing after CJK punctuation -->
*テスト。*テスト

<!-- @case: underscore beside CJK punctuation, as before -->
_テスト。_」

<!-- @case: mark closing after CJK punctuation -->
==強調。==テスト

<!-- @case: mark around a CJK bracket -->
これは==「重要」==です

<!-- @case: del closing after CJK punctuation -->
--削除。--テスト

<!-- @case: ins closing after CJK punctuation -->
++追加。++テスト

<!-- @case: spoiler closing after CJK punctuation -->
||ネタバレ。||テスト

<!-- @case: subscript around a CJK bracket -->
これは~「下付き」~です

<!-- @case: superscript around a CJK bracket -->
これは^「上付き」^です

<!-- @case: subscript and superscript beside CJK text, as before -->
H~2~Oとm^2^です

<!-- @case: mark inside strong, both closing after CJK punctuation -->
**==強調。==**テスト

<!-- @case: strong inside mark -->
==**「重要」**==です

<!-- @case: ideographic space after the opener is whitespace -->
**　テスト**です

<!-- @case: ideographic space before the closer is whitespace -->
**テスト　**です

<!-- @case: an ideograph with a variation selector before the opener -->
大塚︀**"異体字"**です

<!-- @case: after an ideograph with an ideographic variation selector -->
葛󠄀**"城"**です

<!-- @case: quotation marks made fullwidth by U+FE01 are CJK punctuation, so the closer still closes before a letter -->
**“︁Git”︁**Hub

<!-- @case: quotation marks without U+FE01 are not CJK, as before -->
**“Git”**Hub

<!-- @case: no CJK character beside the run, as before -->
**foo.**bar

<!-- @case: in a link -->
[**テスト。**テスト](https://example.com)

<!-- @case: around a link -->
**[リンク](https://example.com)**も注意。

<!-- @case: in a heading -->
# **見出し。**です

<!-- @case: in a list item -->
- **項目。**です
- ==項目。==です

<!-- @case: in a blockquote -->
> **引用。**です

<!-- @case: in a code span -->
`**テスト。**テスト`

<!-- @case: escaped markers -->
\*\*テスト。\*\*テスト

<!-- @case: a character reference in place of a marker -->
&#42;&#42;テスト。&#42;&#42;テスト

<!-- @case: on two lines of one paragraph -->
**テスト。**テスト
**次。**です

<!-- @case: at the end of the document, as before -->
テスト**テスト。**
