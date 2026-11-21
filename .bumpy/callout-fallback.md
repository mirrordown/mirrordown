---
"@mirrordown/mdit-github-alerts": minor
"@mirrordown/remd-github-alerts": minor
"@mirrordown/sat-github-alerts": minor
---

A callout whose type nobody defined is now a callout, as it is in Obsidian, and a callout can carry metadata. Quotes that begin with a `[!word]` marker render differently than before: read the first two entries.

- **An undefined type falls back to an alert of its own type** (all engines), when its identifier is made only of letters, numbers, `_` and `-`. It gets the note's icon and colours, and a title made from the identifier.

  ```markdown
  > [!custom-type]
  > Body.
  ```

  Was `<blockquote><p>[!custom-type]`, a plain quote with the marker as text. Now `<div class="markdown-alert" data-alert="custom-type">` titled "Custom type". Style it with `[data-alert="custom-type"]`, or name it in the `titles` option. An identifier with any other character (`[!a.b]`) is still a quote.

- **`fallback: false` keeps an undefined type a quote** (all engines), for a site that wants only the built-in types and the ones its `types` option registers.

  ```ts
  githubAlerts({ fallback: false })
  ```

- **The type is read as Obsidian reads it** (all engines): spaces around it are dropped and spaces inside it become `-`, before it is lowercased.

  ```markdown
  > [! NOTE ]
  > Body.

  > [!My type]
  > Body.
  ```

  Was a plain quote for both. Now a note, and an alert of the type `my-type`. Keys of the `types` option are read the same way, so `types: { "Release Notes": "release" }` matches `[!release-notes]`.

- **A title needs a space before it** (all engines), as in Obsidian and on GitHub.

  ```markdown
  > [!NOTE]Title
  > Body.
  ```

  Was an alert titled "Title". Now a plain quote: write `> [!NOTE] Title`. The same goes for a fold marker (`> [!NOTE]-Title`), an escaped one (`> [!NOTE]\+ Title`), formatting (`> [!NOTE]*Title*`) and an attribute block (`> [!NOTE]{.wide}`) written straight against the marker. The last of these rendered three different ways in the three engines and is now a quote in each.

- **Text after `|` in the marker is the alert's metadata** (all engines), for a stylesheet to use.

  ```markdown
  > [!info|wide]
  > Body.
  ```

  Was a plain quote. Now `<div class="markdown-alert" data-alert="info" data-alert-metadata="wide">`.

- **With `matchCaseInsensitive: false`, a built-in type written in another case is an undefined type** (all engines).

  ```markdown
  > [!NOTE]
  > Body.
  ```

  Was a plain quote under that option. Now `<div class="markdown-alert" data-alert="NOTE">` titled "NOTE". Add `fallback: false` to keep the quote.

- **An alert of a type the stylesheet has no rule for is readable on a dark page** (all engines). Its background was a fixed light colour whatever the colour scheme; it now uses the note's dark colours there. Nothing changes on a light page.

- **A default title's label has no spaces around it** (Sätteri). With `titles: { note: " Hinweis " }`, `> [!NOTE]` was `aria-label=" Hinweis "` in Sätteri only. Now `aria-label="Hinweis"`, as in markdown-it and remark.
