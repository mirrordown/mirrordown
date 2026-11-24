<!-- @case: basic word -->

==Mark==

<!-- @case: start of sentence -->

==Mark me== and leave me

<!-- @case: end of sentence -->

leave me and ==Mark me==

<!-- @case: middle of sentence -->

leave me and ==Mark me== and leave me

<!-- @case: multiple marks -->

==first marked== and ==second marked==

<!-- @case: equality operator -->

if a == b then c == d

<!-- @case: adjacent to word chars -->

foo==bar==baz

<!-- @case: wrapping strong -->

==**bold marked**==

<!-- @case: wrapping emphasis -->

==_italic marked_==

<!-- @case: inside strong -->

**==marked inside bold==**

<!-- @case: inside emphasis -->

_==marked inside italic==_

<!-- @case: in heading -->

## ==Marked heading==

<!-- @case: in list items -->

- ==first item==
- ==second item==

<!-- @case: in blockquote -->

> ==blockquote content==

<!-- @case: mixed inline content -->

==**bold** and regular==

<!-- @case: empty mark -->

====

<!-- @case: unclosed opening -->

foo ==bar

<!-- @case: escaped opening delimiter is literal -->

\==text==

<!-- @case: escaped closing delimiter is literal -->

==text\==

<!-- @case: escaped backslash keeps the delimiter -->

\\==text==

<!-- @case: an odd-length run leaves its extra marker outside the span -->

===a===

<!-- @case: a closer pairs with the nearest opener -->

==a ==b==

<!-- @case: spans nest -->

==a ==b== c==

<!-- @case: a run between spaces neither opens nor closes -->

==a === b==

<!-- @case: colour: a red circle or square colours a highlight red -->

==🔴circle== ==🟥square==

<!-- @case: colour: an orange circle or square colours a highlight orange -->

==🟠circle== ==🟧square==

<!-- @case: colour: a yellow circle or square colours a highlight yellow -->

==🟡circle== ==🟨square==

<!-- @case: colour: a green circle or square colours a highlight green -->

==🟢circle== ==🟩square==

<!-- @case: colour: a blue circle or square colours a highlight blue -->

==🔵circle== ==🟦square==

<!-- @case: colour: a purple circle or square colours a highlight purple -->

==🟣circle== ==🟪square==

<!-- @case: colour: an emoji that is not one of the twelve markers is text -->

==🟤 brown== ==⚪ white== ==🟫 square==

<!-- @case: colour: a plain highlight has no attribute -->

==text==

<!-- @case: colour: a marker in the middle of the content is text -->

==te🔴xt==

<!-- @case: colour: a marker inside formatting is not the content's first character -->

==**🔴bold**==

<!-- @case: colour: a space after the opening delimiter means no highlight -->

== 🔴 text==

<!-- @case: colour: only the marker goes, the space after it stays -->

==🟠 text==

<!-- @case: colour: a highlight of only a marker is empty -->

==🔴==

<!-- @case: colour: a variation selector after the marker stays in the content -->

==🔴️ text==

<!-- @case: colour: only the first of two markers is read -->

==🔴🟩text==

<!-- @case: colour: a marker written as a character reference is text -->

==&#x1F534;text== ==&#128308;text==

<!-- @case: colour: a character reference after the marker stays -->

==🔴&amp;text==

<!-- @case: colour: a backslash before the marker is text, and so is the marker -->

==\🔴text==

<!-- @case: colour: an escaped opening delimiter is text, and so is the marker -->

\==🔴 text==

<!-- @case: colour: an escaped character after the marker stays escaped -->

==🔴\==text==

<!-- @case: colour: nested highlights are coloured each by its own first character -->

==🔴a ==🟢b== c==

<!-- @case: colour: a closer pairs with the nearest opener, which takes the colour -->

==🔴a ==🟢b==

<!-- @case: colour: a highlight that opens with another highlight has no colour of its own -->

====🔴a==b==

<!-- @case: colour: each highlight in a paragraph has its own colour -->

==🔴a== and ==🟦b== and ==c==

<!-- @case: colour: an odd-length run leaves its extra marker outside a coloured highlight -->

===🔴a===

<!-- @case: colour: formatting after the marker stays -->

==🔴**bold** text==

<!-- @case: colour: a highlight across a line break -->

==🔴
text==

<!-- @case: colour: a hard break straight after the marker -->

==🔴\
text==

<!-- @case: colour: inside emphasis -->

*==🔴a==*

<!-- @case: colour: inside a link -->

[==🔴a==](https://example.com)

<!-- @case: colour: a link as the first child is not text -->

==[🔴a](https://example.com)==

<!-- @case: colour: in a heading -->

## ==🔴heading==

<!-- @case: colour: in list items -->

- ==🔴first==
- ==🟢second==

<!-- @case: colour: in a blockquote -->

> ==🔵quote==

<!-- @case: colour: a code span is code, inside a highlight or around one -->

`==🔴a==` ==`🔴`==

<!-- @case: colour: a replacement pattern after the marker stays as written -->

==🔴$&$$$'==

<!-- @case: colour: text naming an inherited object member is not a colour -->

==constructor== ==__proto__== ==toString==

<!-- @case: colour: a marker is punctuation to the delimiter, so a run straight after a letter does not open -->

foo==🔴bar== and foo ==🔴bar==baz

<!-- @case: label: each of the ten labels names its variant and keeps its emoji -->

==🐛 Bug== ==📖 Docs== ==✨ New== ==❓ Why== ==🙋 Help== ==🌱 Start== ==👯 Again== ==🚫 No== ==⛔ Never== ==⚠️ Careful==

<!-- @case: label: the warning sign is one marker with or without its variation selector -->

==⚠ bare== ==⚠️ selected==

<!-- @case: label: a label straight before text -->

==🐛Bug==

<!-- @case: label: a label before formatting -->

==🐛**Bug** here==

<!-- @case: label: a highlight of only a label keeps it -->

==🐛==

<!-- @case: label: a label not at the start is text -->

==a 🐛== ==a⚠️==

<!-- @case: label: a label written as a character reference is text -->

==&#x1F41B; Bug== ==&#x26A0;&#xFE0F; Careful==

<!-- @case: label: the warning sign before a variation selector written as a character reference -->

==⚠&#xFE0F; Careful==

<!-- @case: label: a variation selector before the marker is not passed over -->

==️🐛 Bug==

<!-- @case: label: a variation selector after a label stays with it -->

==🐛️ Bug==

<!-- @case: label: only the first marker is read, colour or label -->

==🔴🐛 a== ==🐛🔴 b==

<!-- @case: label: an emoji that is not a marker is text -->

==🐜 ant== ==📕 book==

<!-- @case: label: inside a link -->

[==🐛 Bug==](https://example.com)

<!-- @case: label: in a heading -->

## ==⚠️ Careful==

<!-- @case: label: in list items -->

- ==🐛 Bug==
- ==✨ New==

<!-- @case: label: in a blockquote -->

> ==❓ Why==

<!-- @case: label: a code span is code -->

`==🐛 Bug==` ==`🐛`==

<!-- @case: label: an escaped opening delimiter is text, and so is the label -->

\==🐛 Bug==

<!-- @case: label: a highlight that opens with another highlight has no variant of its own -->

====🐛a==b==

<!-- @case: label: nested highlights each take their own variant -->

==🐛a ==⚠️b== c==
