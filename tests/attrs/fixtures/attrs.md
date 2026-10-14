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
