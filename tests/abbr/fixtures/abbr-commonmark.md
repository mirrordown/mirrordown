<!-- @case: basic abbreviation -->
*[HTML]: Hyper Text Markup Language

The HTML specification.

<!-- @case: multiple definitions -->
*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

The HTML specification is maintained by the W3C.

<!-- @case: multiple uses -->
*[API]: Application Programming Interface

Use the API to access the API endpoint.

<!-- @case: no match for partial word suffix -->
*[AB]: ref

ABC

<!-- @case: no match for partial word prefix -->
*[BC]: ref

ABC

<!-- @case: first definition wins -->
*[CSS]: Cascading Style Sheets
*[CSS]: Cascading Something Sheets

CSS is great.

<!-- @case: longer abbreviation takes priority -->
*[JS HTTP]: is awesome
*[HTTP]: hyper text

JS HTTP is nice.

<!-- @case: in heading -->
*[API]: Application Programming Interface

## API Reference

<!-- @case: in blockquote -->
*[TDD]: Test Driven Development

> Use TDD.

<!-- @case: in list item -->
*[OOP]: Object Oriented Programming

- OOP principles

<!-- @case: inside strong -->
*[API]: Application Programming Interface

**API** is documented.

<!-- @case: inside emphasis -->
*[API]: Application Programming Interface

_API_ is documented.

<!-- @case: no abbreviations defined -->
No abbreviation here.

<!-- @case: term that starts or ends with a symbol -->
*[C++]: C plus plus
*[.NET]: dot net
*[C#]: C sharp

Use C++ and .NET and C# daily.

<!-- @case: term in another script -->
*[日本]: Japan
*[café]: coffee

日本 is here, a café there.

<!-- @case: no match next to a letter of any script -->
*[HTML]: Hyper Text

HTMLé éHTML これはHTMLです

<!-- @case: punctuation and underscore end a word -->
*[HTML]: Hyper Text

foo_HTML HTML_bar (HTML) HTML-5 「HTML」

<!-- @case: no match next to a symbol that is not punctuation -->
*[HTML]: Hyper Text

HTML™ HTML° ©HTML
