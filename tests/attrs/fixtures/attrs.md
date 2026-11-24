<!-- @case: fence: language with class -->
```js {.highlight}
const x = 1;
```

<!-- @case: fence: language with id -->
```python {#code-block}
print("hello")
```

<!-- @case: fence: multiple attrs -->
```ts {.foo #bar data-lang=typescript}
type T = string;
```

<!-- @case: fence: no language with attr -->
``` {.plain}
plain text
```

<!-- @case: heading: h1 with class -->
# Hello World {.title}

<!-- @case: heading: h2 with id -->
## Section Two {#section-2}

<!-- @case: heading: multiple attrs -->
### Deep Section {.active #deep data-level=3}

<!-- @case: hr: thematic break with class -->

---

{.divider}

<!-- @case: block: paragraph with trailing class -->
Hello world. {.intro}

<!-- @case: block: paragraph with id -->
Some text. {#para-id}

<!-- @case: softbreak: block via softbreak attr line -->
A paragraph with attrs
{.softbreak-class}

<!-- @case: inline: em with class -->
*emphasized*{.em-class}

<!-- @case: inline: strong with class -->
**bold**{.bold-class}

<!-- @case: inline: code span with class -->
`code`{.code-class}

<!-- @case: inline: image with class -->
![alt](img.png){.img-class}

<!-- @case: list: item end attr -->
- item one {.red}
- item two

<!-- @case: list: list-level attr via softbreak -->
- alpha
- beta

{.my-list}

<!-- @case: list: nested list attr -->
- parent
  - child a
  - child b
  {.inner-list}

<!-- @case: table: table-level attr -->
| A | B |
|---|---|
| 1 | 2 |

{.my-table}

<!-- @case: table: cell attr -->
| Header |
|--------|
| cell {.cell-class} |

<!-- @case: fence: language with id only -->
```js {#c}
x
```

<!-- @case: list: loose item end attr -->
- item one {.red}

- item two

<!-- @case: list: ordered item end attr -->
1. one {.x}
2. two

<!-- @case: list: lazy attr line applies to the list -->
- a
- b
{.my-list}

<!-- @case: softbreak: attr line after a hard break keeps the break -->
para\
{.cls}

<!-- @case: table: header cell attr -->
| H {.hc} |
|---|
| c |

<!-- @case: braces in image alt text are not paragraph attributes -->

![{.cls}](x.png)

<!-- @case: braces in image alt text are not heading attributes -->

## ![{.cls}](x.png)

<!-- @case: braces in image alt text are not list item attributes -->

- ![{.cls}](x.png)

<!-- @case: inline: text after the block stays -->
This is **important**{.warning} text.

<!-- @case: inline: a link with text after the block -->
See [the guide](/guide){target=_blank} first.

<!-- @case: inline: blocks that follow one another merge -->
Run `npm i`{.cmd}{#install} to install.

<!-- @case: inline: a block after a space still ends the paragraph -->
**bold**{.inner} {#outer}

<!-- @case: inline: nested elements -->
**a *b*{.in} c**{.out} d

<!-- @case: inline: an element ending a heading takes the block -->
# Title with **bold**{.mark}

<!-- @case: inline: an element ending a list item takes the block -->
- item with **bold**{.mark}

<!-- @case: block: text before a block on the last line is not part of it -->
para
{.x} {#y}

<!-- @case: inline: an element ending a table cell takes the block -->
| a **b**{.mark} |
| --- |
| c |

<!-- @case: own line: a lazy line after a blockquote goes on the blockquote -->
> quote
{.c}

<!-- @case: own line: a line in a blockquote goes on the paragraph -->
> para
> {.x}

<!-- @case: own line: a line in the outer of two blockquotes goes on the inner -->
> > para
> {.x}

<!-- @case: own line: a lazy line after two blockquotes goes on the outer -->
> > para
{.x}

<!-- @case: own line: a line in a blockquote before more blocks goes on the paragraph -->
> para
> {.x}
>
> more

<!-- @case: own line: a line in a tight list item goes on the item -->
- a
  {.x}

<!-- @case: own line: a line in a loose list item goes on the paragraph -->
- a

  para
  {.x}

<!-- @case: own line: a lazy line after a loose list item goes on the list -->
- a

  para
{.x}

<!-- @case: own line: nested lists take the block by indentation -->
- item 1{.a}
  - nested item {.b}
  {.c}
    1. nested nested item {.d}
    {.e}

<!-- @case: own line: a paragraph of its own goes on the outer list -->
- item
  - nested
  {.red}

{.blue}

<!-- @case: own line: a lazy line after a list in a blockquote goes on the list -->
> - a
> {.x}

<!-- @case: own line: a line in a list item in a blockquote goes on the item -->
> - a
>   {.x}

<!-- @case: own line: a line in a blockquote in a list item goes on the paragraph -->
- a
  > q
  > {.x}

<!-- @case: own line: a lazy line after a blockquote in a list item goes on the blockquote -->
- a
  > q
  {.x}

<!-- @case: own line: a line in an ordered list item goes on the item -->
1. a
   {.x}

<!-- @case: removed paragraph: a fence after a rule's block keeps its own -->
---

{.h}

```js {.x}
code
```

<!-- @case: removed paragraph: a fence after a table's block keeps its own -->
| a |
|---|
| b |

{.t}

```js {.x}
code
```

<!-- @case: removed paragraph: a fence after a list's block keeps its own -->
- a

{.l}

```js {.x}
code
```

<!-- @case: removed paragraph: two blocks after a table both go on it -->
| a |
|---|
| b |

{.t}

{.u}

<!-- @case: removed paragraph: two blocks after a list both go on it -->
- a

{.l}

{.m}

<!-- @case: removed paragraph: two blocks after a rule both go on it -->
---

{.h}

{.i}

<!-- @case: removed paragraph: three blocks after a table -->
| a |
|---|
| b |

{.t}

{.u}

{.v}

<!-- @case: removed paragraph: three blocks after a list -->
- a

{.l}

{.m}

{.n}

<!-- @case: removed paragraph: three blocks after a rule -->
---

{.h}

{.i}

{.j}

<!-- @case: removed paragraph: a paragraph ending in a block after a table's block -->
| a |
|---|
| b |

{.t}

para {.p}

<!-- @case: removed paragraph: a paragraph ending in a block after a list's block -->
- a

{.l}

para {.p}

<!-- @case: removed paragraph: a paragraph ending in a block after a rule's block -->
---

{.h}

para {.p}

<!-- @case: removed paragraph: a heading after a rule's block keeps its own -->
---

{.h}

# H {.g}

<!-- @case: removed paragraph: a rule and its block after another -->
a

---

{.h}

---

{.i}

<!-- @case: removed paragraph: a list and its block after a rule's -->
---

{.h}

- a

{.l}

<!-- @case: removed paragraph: two blocks after a rule in a blockquote -->
> ---
>
> {.h}
>
> {.i}

<!-- @case: removed paragraph: a fence after a table's block in a blockquote -->
> | a |
> |---|
> | b |
>
> {.t}
>
> ```js {.x}
> code
> ```

<!-- @case: removed paragraph: a paragraph ending in a block after a list's block in a blockquote -->
> - a
>
> {.l}
>
> para {.p}

<!-- @case: removed paragraph: two blocks after a list in a list item -->
- a

  - b

  {.l}

  {.m}

<!-- @case: removed paragraph: a fence after a list's block in a list item -->
- a

  - b

  {.l}

  ```js {.x}
  code
  ```

<!-- @case: removed paragraph: two blocks after a table in a list item -->
- a

  | a |
  |---|
  | b |

  {.t}

  {.u}

<!-- @case: removed paragraph: a paragraph ending in a block after a list's block in a list item -->
- a

  - b

  {.l}

  para {.p}
