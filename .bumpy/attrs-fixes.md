---
"@mirrordown/mdit-attrs": patch
"@mirrordown/remd-attrs": patch
---

attrs no longer fails a page over one attribute name, places blocks in linear time, and markdown-it reads on correctly after a block paragraph.

- **An attribute named `constructor` no longer fails the page** (remark). The serializer remark-rehype hands the tree to throws on a name that lower-cases to `constructor` or `__proto__`, so one block took the whole document down. That one attribute is now left out and the rest of the block applies. markdown-it and Sätteri write the attribute, as before.

  ```markdown
  text {.a constructor=x #b}
  ```

  Was `TypeError: Cannot read properties of undefined (reading 'overloadedBoolean')`. Now `<p class="a" id="b">text</p>`.

- **A fence or heading right after a block paragraph keeps its own block** (markdown-it). A block paragraph that went on a list, table or rule made markdown-it skip the token after it.

  ````markdown
  ---

  {.h}

  ```js {.x}
  code
  ```
  ````

  Was `<hr class="h"><pre><code class="language-js">…`. Now, as in remark and Sätteri, `<hr class="h"><pre><code class="x language-js">…`.

  ```markdown
  ---

  {.h}

  # H {.g}
  ```

  Was `<hr class="h"><h1>H {.g}</h1>`. Now `<hr class="h"><h1 class="g">H</h1>`.

- **Several block paragraphs after a list, table or rule all go on it** (markdown-it). The second one was printed as an empty paragraph.

  ```markdown
  | a |
  |---|
  | b |

  {.t}

  {.u}
  ```

  Was `<table class="t">…</table><p class="u"></p>`. Now, as in remark and Sätteri, `<table class="t u">…</table>`.

- **A fence with a language writes the block's class first** (markdown-it), whatever the block names before it.

  ````markdown
  ```js {data-x=1 .a}
  code
  ```
  ````

  Was `<code data-x="1" class="a language-js">`. Now, as in remark and Sätteri, `<code class="a language-js" data-x="1">`.

- **Blocks are placed in linear time** (markdown-it and remark). A document with many attribute blocks took time that grew with the square of its length. The output does not change.

  ```markdown
  ![a](a.png)
  {.c}
  ```

  20,000 of these took markdown-it 27 s and now take 0.16 s. 20,000 tables each followed by `{.t}` took 5.5 s and now take 0.44 s. In remark, the plugin's own share for 20,000 list items each with a block on its own line went from 4.4 s to 0.34 s.
