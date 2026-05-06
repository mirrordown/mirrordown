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

<!-- @case: inline: strikethrough with class -->
~~struck~~{.del-class}

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
