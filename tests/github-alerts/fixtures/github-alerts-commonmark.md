<!-- @case: note -->
> [!NOTE]
> This is a note.

<!-- @case: tip -->
> [!TIP]
> This is a tip.

<!-- @case: important -->
> [!IMPORTANT]
> This is important.

<!-- @case: warning -->
> [!WARNING]
> This is a warning.

<!-- @case: caution -->
> [!CAUTION]
> This is a caution.

<!-- @case: abstract (obsidian) -->
> [!ABSTRACT]
> This is an abstract.

<!-- @case: info (obsidian) -->
> [!INFO]
> This is info.

<!-- @case: todo (obsidian) -->
> [!TODO]
> This is a todo.

<!-- @case: success (obsidian) -->
> [!SUCCESS]
> This is a success.

<!-- @case: question (obsidian) -->
> [!QUESTION]
> This is a question.

<!-- @case: failure (obsidian) -->
> [!FAILURE]
> This is a failure.

<!-- @case: danger (obsidian) -->
> [!DANGER]
> This is danger.

<!-- @case: bug (obsidian) -->
> [!BUG]
> This is a bug.

<!-- @case: example (obsidian) -->
> [!EXAMPLE]
> This is an example.

<!-- @case: quote (obsidian) -->
> [!QUOTE]
> This is a quote.

<!-- @case: all lowercase -->
> [!note]
> Lowercase keyword.

<!-- @case: mixed case -->
> [!imporTANT]
> Mixed case keyword.

<!-- @case: alias summary maps to abstract -->
> [!SUMMARY]
> Summary alias.

<!-- @case: alias tldr maps to abstract -->
> [!TLDR]
> TLDR alias.

<!-- @case: alias hint maps to tip -->
> [!HINT]
> Hint alias.

<!-- @case: alias check maps to success -->
> [!CHECK]
> Check alias.

<!-- @case: alias done maps to success -->
> [!DONE]
> Done alias.

<!-- @case: alias help maps to question -->
> [!HELP]
> Help alias.

<!-- @case: alias faq maps to question -->
> [!FAQ]
> FAQ alias.

<!-- @case: alias attention maps to warning -->
> [!ATTENTION]
> Attention alias.

<!-- @case: alias fail maps to failure -->
> [!FAIL]
> Fail alias.

<!-- @case: alias missing maps to failure -->
> [!MISSING]
> Missing alias.

<!-- @case: alias error maps to danger -->
> [!ERROR]
> Error alias.

<!-- @case: alias cite maps to quote -->
> [!CITE]
> Cite alias.

<!-- @case: no space after > -->
>[!NOTE]
>Body text.

<!-- @case: multiple spaces before marker -->
>  [!NOTE]
> Body text.

<!-- @case: three spaces before marker -->
>   [!NOTE]
> Body text.

<!-- @case: custom title -->
> [!NOTE] My Custom Title
> Body text.

<!-- @case: custom title with foldable -->
> [!WARNING]+ Heads Up
> Pay attention.

<!-- @case: multi-paragraph body -->
> [!NOTE]
>
> First paragraph.
>
> Second paragraph.

<!-- @case: multi-paragraph with empty lines -->
> [!IMPORTANT]
>
>
> First paragraph.
>
>
> Second paragraph.

<!-- @case: nested markdown in body -->
> [!TIP]
> Use **bold** and _italic_ text freely.

<!-- @case: lazy continuation -->
> [!WARNING]
> This is a warning
a

<!-- @case: marker only no body -->
> [!NOTE]

<!-- @case: foldable open -->
> [!NOTE]+
> This alert starts open.

<!-- @case: foldable closed -->
> [!NOTE]-
> This alert starts closed.

<!-- @case: missing closing bracket -->
> [!note

<!-- @case: no bang prefix -->
> [Important]
> Not an alert.

<!-- @case: exclamation before bracket -->
> ![Important]
> Not an alert.

<!-- @case: four space indent becomes code block -->
>     [!NOTE]
> Body text.

<!-- @case: unknown type passthrough -->
> [!UNKNOWN]
> Not an alert.

<!-- @case: regular blockquote -->
> Just a regular blockquote.

<!-- @case: regular blockquote two lines -->
> Just a normal blockquote
> Second line

<!-- @case: preceded by heading -->
# Title
> [!IMPORTANT]
> This is an important note.

<!-- @case: followed by paragraph -->
> [!IMPORTANT]
> This is an important note.

Paragraph text.

<!-- @case: followed by thematic break -->
> [!WARNING]
> This is a warning.
---

<!-- @case: followed by heading -->
> [!NOTE]
> This is a note.
# Heading

<!-- @case: followed by fenced code -->
> [!TIP]
> This is a tip.
```
code block
```

<!-- @case: followed by list -->
> [!CAUTION]
> This is a caution.
- List item

<!-- @case: preceded by paragraph -->
Paragraph
> [!TIP]
> Body text.

<!-- @case: nested alert inside alert -->
> [!WARNING]
> This is a warning
> > [!NOTE]
> > This is a note

<!-- @case: alert inside list item -->
- > [!NOTE]
  > Body inside list.

<!-- @case: no icons -->
> [!NOTE]
> Icon suppressed.
