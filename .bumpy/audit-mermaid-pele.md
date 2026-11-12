---
"@mirrordown/mdit-mermaid-pele": patch
"@mirrordown/remd-mermaid-pele": patch
"@mirrordown/sat-mermaid-pele": patch
---

Fixes for two fences the three engines did not render alike.

- **A fence in another language given the class `language-mermaid` stays a code block** (remark, Sätteri), with the attrs plugin or Sätteri's `attributes` feature.

  ````markdown
  ```js {.language-mermaid}
  flowchart LR
    A --> B
  ```
  ````

  Was drawn as a diagram. Now `<pre><code class="language-mermaid language-js">…</code></pre>`, as in markdown-it: the language is the first word of the info string. A `mermaid` fence given another language's class is still a diagram.

- **A diagram in a fence left open at the end of the input gets the same ids as in the other engines** (markdown-it).

  ````markdown
  ```mermaid
  flowchart LR
    accTitle: T
    A --> B
  ````

  Was `<title id="mermaid-1gsv8jj-title">`, a prefix no other engine gave. Now `mermaid-11v4lnz-title`, the ids remark and Sätteri give and the ids of the same diagram with its fence closed.

The guide now says to list the plugin before copy-code in remark and Sätteri, and that a diagram's ids are unique per document rather than per page.
