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

<!-- @case: unknown type falls back to an alert of its own type -->
> [!UNKNOWN]
> Body text.

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

<!-- @case: body starting with formatting is kept -->
> [!NOTE]
> **Bold** start of the body.

<!-- @case: formatted custom title -->
> [!NOTE] *Emphasized* title
> Body text.

<!-- @case: code in custom title -->
> [!TIP] Use `npm ci`
> Body text.

<!-- @case: formatted custom title with nothing after it -->
> [!WARNING]- Custom *title*

<!-- @case: formatted custom title followed by body on the next line -->
> [!WARNING]- Custom *title*
> Body

<!-- @case: marker line ending in a hard break -->
> [!NOTE]\
> After a hard break.

<!-- @case: spec 28: callout with a title and a body -->
> [!info] Here's a callout title
> Here's a callout block.

<!-- @case: spec 29: default title -->
> [!WARNING]
> Careful.

<!-- @case: spec 30: title-only callout -->
> [!tip] Title-only callout

<!-- @case: spec 31: folded closed alias -->
> [!faq]- Are callouts foldable?
> Yes!

<!-- @case: spec 32: nested callouts -->
> [!question] Can callouts be nested?
> > [!todo] Yes!, they can.

<!-- @case: spec 33: marker not at the start of the line stays a quote -->
> See [!info] here

<!-- @case: spec 33: text right after the marker leaves a quote -->
> [!info]nospace

<!-- @case: a fold marker with text right after it leaves a quote -->
> [!info]-nospace

<!-- @case: formatting right after the marker leaves a quote -->
> [!info]*nospace*

<!-- @case: a title after a space, with formatting -->
> [!info] *spaced*

<!-- @case: fallback type with a hyphen reads as words in its title -->
> [!custom-type]
> Body text.

<!-- @case: fallback type with spaces is normalised to hyphens -->
> [!My  custom type]
> Body text.

<!-- @case: fallback type in mixed case is lowercased -->
> [!CuStOm]
> Body text.

<!-- @case: fallback type with a non-ASCII letter -->
> [!重要]
> Body text.

<!-- @case: fallback type with a custom title -->
> [!custom-type] My *own* title
> Body text.

<!-- @case: fallback type title only -->
> [!custom-type] Title only

<!-- @case: fallback type folded open -->
> [!custom-type]+
> Body text.

<!-- @case: fallback type folded closed -->
> [!custom-type]- Closed
> Body text.

<!-- @case: fallback type nested in an alert -->
> [!NOTE]
> > [!custom-type]
> > Body text.

<!-- @case: alert nested in a fallback type -->
> [!custom-type]
> > [!other-type]
> > Body text.

<!-- @case: fallback type inside list item -->
- > [!custom-type]
  > Body inside list.

<!-- @case: identifier with a dot is not an alert -->
> [!a.b]
> Not an alert.

<!-- @case: whitespace-only identifier is not an alert -->
> [! ]
> Not an alert.

<!-- @case: identifier with spaces around it is trimmed -->
> [! NOTE ]
> Body text.

<!-- @case: metadata on a built-in type -->
> [!info|wide]
> Body text.

<!-- @case: empty metadata on a built-in type -->
> [!info|]
> Body text.

<!-- @case: metadata on a fallback type -->
> [!custom-type|wide]
> Body text.

<!-- @case: empty metadata on a fallback type -->
> [!custom-type|]
> Body text.

<!-- @case: metadata is trimmed and keeps its inner spaces -->
> [!note|  wide  left ]
> Body text.

<!-- @case: whitespace-only metadata adds nothing -->
> [!note|   ]
> Body text.

<!-- @case: metadata keeps a second pipe -->
> [!note|a|b]
> Body text.

<!-- @case: metadata on a foldable alert -->
> [!note|wide]+ Title
> Body text.

<!-- @case: metadata on an alias -->
> [!faq|wide]- Title
> Body text.
