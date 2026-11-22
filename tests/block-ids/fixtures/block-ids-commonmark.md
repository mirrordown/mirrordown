<!-- @case: a marker at the end of a paragraph names it -->

The quick purple gem dashes through the paragraph. ^37066d

<!-- @case: the id holds the caret and the identifier as written, upper case included -->

text ^BLK

<!-- @case: an identifier is letters, digits and hyphens -->

Gemmy ^item-1-2a

<!-- @case: a tab before the caret separates it as a space does -->

text	^blk

<!-- @case: an underscore is not an identifier character, so the marker is text -->

text ^blk_x

<!-- @case: a caret with no identifier is text -->

text ^

<!-- @case: a caret after a word is text -->

not-a-marker^abc

E = mc^2

<!-- @case: a caret right after a code span is text -->

`code`^blk

`Line.`^blk

<!-- @case: a marker that is not at the end is text -->

^abc is not at the end

<!-- @case: a marker with a space after it on its line is text -->

text ^blk 

text ^tab	

text ^kept

<!-- @case: an escaped bracket before a caret is text, as Obsidian's own reading of it is a bug -->

x\[^1

<!-- @case: an escaped caret is text -->

text \^blk

<!-- @case: a character reference for the caret is text -->

text &#94;blk

text &Hat;blk

<!-- @case: an escaped identifier character makes the marker text -->

text ^a\-b

<!-- @case: a marker inside emphasis is text -->

*x ^blk*

*^blk*

**text ^blk**

<!-- @case: a marker inside a link is text -->

[^blk](u)

[link ^x](u)

<!-- @case: a marker inside a code span is text -->

`^blk`

text `code ^blk`

<!-- @case: a fenced code block is not read -->

```
code ^blk
```

<!-- @case: an indented code block is not read -->

para

    code ^blk

<!-- @case: only the last marker counts -->

text ^one ^two

^blk ^blk2

<!-- @case: a marker on its own line after text is removed with the line ending -->

Some text
^abc

<!-- @case: a marker after a hard break is removed with the break -->

Some text  
^abc

<!-- @case: a marker after a backslash break is removed with the break and the space before it -->

Some text \
^abc

<!-- @case: all the spaces before a marker are removed -->

text    ^abc

<!-- @case: a marker after emphasis names the paragraph -->

*x* ^blk

<!-- @case: a marker in a paragraph that spans lines names it -->

The first line
and the second ^two-lines

<!-- @case: a marker at the end of an ATX heading names the heading -->

## Heading ^heading-id

<!-- @case: the closing sequence of an ATX heading is not text after the marker -->

## Heading ^closed ##

<!-- @case: a marker at the end of a setext heading names the heading -->

Setext heading ^setext-id
---

Equals heading ^equals-id
===

<!-- @case: a heading that is only a marker is named and empty -->

# ^blk

^setext
---

<!-- @case: a marker in a tight list item names the item -->

- Gemmy ^item-1
- Unhelpful assistant

<!-- @case: a marker in an ordered list item names the item -->

1. First ^first
2. Second

<!-- @case: nested items each take their own marker -->

- Item ^one
  - Sub ^two

<!-- @case: a marker in a nested item names the innermost item -->

- a
  - b ^id

<!-- @case: a marker on its own continuation line of a nested item names it -->

- Item one
    - Nested item
      ^nested-id

<!-- @case: a marker alone in its own paragraph of a loose item names the item -->

- a

  ^id

<!-- @case: a list item that is only a marker is named and empty -->

- ^only
- b

<!-- @case: a marker on a lazy line after a list names the last item -->

- one
- two
^lazy

<!-- @case: a marker in a quote names the quote -->

> text ^blk

<!-- @case: a marker alone in a quote's last paragraph names the quote -->

> x
>
> ^b

<!-- @case: a marker on a list item inside a quote names the quote -->

> - a
> - b ^id

<!-- @case: a marker on a lazy line after a quote names the quote -->

> Some quoted text
^lazy-quote

<!-- @case: a marker in a nested quote names the outermost quote -->

> outer
> > inner ^x

<!-- @case: a marker at the end of a heading in a quote names the quote -->

> ## Heading ^h

<!-- @case: a quotation, a marker line and a line after it are one paragraph -->

> A quotation.
^37066f
Next.

<!-- @case: a marker alone after a paragraph names the paragraph -->

para

^own

<!-- @case: a marker alone after a list names the list -->

- x

^list

<!-- @case: a marker alone after a quote names the quote -->

> A quoted block.

^quote-id

<!-- @case: a marker alone after a fenced code block names the code -->

```js
code
```

^code

<!-- @case: a marker alone after an indented code block names the code -->

para

    code

^indented

<!-- @case: a marker alone after a thematic break names it -->

***

^rule

<!-- @case: a marker alone after a heading names the heading -->

## Title

^title

<!-- @case: a marker alone after a link reference definition names the block before it -->

para

[ref]: /url

^after-definition

<!-- @case: a marker alone at the start of the document names nothing -->

^first

para

<!-- @case: a marker alone with nothing else names nothing -->

^alone

<!-- @case: two markers alone in a row name the same block, the last one winning -->

para

^first

^second

<!-- @case: a block named twice takes the last marker -->

para ^first

^second

<!-- @case: two markers inside one quote name it, the last one winning -->

> - Item one ^item-one
> - Item two ^item-two

<!-- @case: an identifier used twice stays with the block named last -->

x ^b

y ^b

<!-- @case: an identifier taken from a block that a later marker renames stays with the block before -->

x ^b

y ^b

^c

<!-- @case: identifiers that are members of every object name their blocks -->

para ^constructor

para ^toString

para ^hasOwnProperty

<!-- @case: an identifier with underscores is text -->

^__proto__

<!-- @case: a marker in a heading of a list item names the heading -->

- # Heading ^h

<!-- @case: a marker at the very end of the document -->

para

last ^end
