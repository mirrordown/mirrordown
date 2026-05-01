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
