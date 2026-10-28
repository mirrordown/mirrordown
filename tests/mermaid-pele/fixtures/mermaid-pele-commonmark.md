<!-- @case: fence: renders the diagram in place of the code block -->

Before.

```mermaid
flowchart LR
  A --> B
```

After.

<!-- @case: fence: tildes -->

~~~mermaid
flowchart LR
  A --> B
~~~

<!-- @case: fence: words after the language are ignored -->

```mermaid title="ignored"
flowchart LR
  A --> B
```

<!-- @case: untouched: another language -->

```js
const flowchart = "LR";
```

<!-- @case: untouched: the language is case-sensitive -->

```Mermaid
flowchart LR
  A --> B
```

<!-- @case: untouched: a language that starts with mermaid -->

```mermaidjs
flowchart LR
  A --> B
```

<!-- @case: untouched: a fence without a language -->

```
flowchart LR
  A --> B
```

<!-- @case: untouched: indented code -->

Indented:

    flowchart LR
      A --> B

<!-- @case: untouched: inline code -->

`mermaid` and `flowchart LR`

<!-- @case: accessibility: title and description -->

```mermaid
flowchart LR
  accTitle: Big decisions
  accDescr: Bob's Burgers' process for making big decisions
  A[Identify a big decision] --> B{Make it}
  B --> D[Be done]
```

<!-- @case: ids: each diagram gets its own prefix -->

```mermaid
sequenceDiagram
  accTitle: First
  Alice->>Bob: Hello
```

```mermaid
sequenceDiagram
  accTitle: Second
  Alice->>Bob: Hello
```

<!-- @case: ids: a repeated diagram counts its repeats -->

```mermaid
sequenceDiagram
  accTitle: Same
  Alice->>Bob: Hello
```

```mermaid
sequenceDiagram
  accTitle: Same
  Alice->>Bob: Hello
```

<!-- @case: escaping: markup characters are text, and <b> is SVG bold, not HTML -->

```mermaid
flowchart LR
  A["Tom & Jerry <3"] --> B["say &quot;hi&quot;"]
  B --> C["<b>bold</b>"]
```

<!-- @case: links: safe schemes are kept, scripts are dropped -->

```mermaid
flowchart LR
  A --> B
  click A "https://example.com" "Example"
  click B "javascript:alert(1)"
```

<!-- @case: config: front matter -->

```mermaid
---
title: Configured
config:
  flowchart:
    curve: linear
---
flowchart LR
  A --> B
```

<!-- @case: config: init directive -->

```mermaid
%%{init: {"flowchart": {"curve": "linear"}}}%%
flowchart LR
  A --> B
```

<!-- @case: types: state, class, pie and gantt -->

```mermaid
stateDiagram-v2
  [*] --> Still
  Still --> Moving
  Moving --> [*]
```

```mermaid
classDiagram
  Animal <|-- Duck
  Animal : +int age
```

```mermaid
pie title Pets
  "Dogs" : 3
  "Cats" : 2
```

```mermaid
gantt
  title Plan
  dateFormat YYYY-MM-DD
  section Build
  Write :a1, 2026-01-01, 10d
  Test  :after a1, 5d
```

<!-- @case: nesting: in a blockquote -->

> Quoted:
>
> ```mermaid
> flowchart LR
>   A --> B
> ```

<!-- @case: nesting: in a list item -->

- Item:

  ```mermaid
  flowchart LR
    A --> B
  ```

- Next item
