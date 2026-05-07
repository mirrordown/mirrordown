<!-- @case: single step no body -->

@1. Step one

<!-- @case: single step with body -->

@1. Step one
>
>  This is the step body.

<!-- @case: single step empty title -->

@1.
>  Body without a title.

<!-- @case: two steps -->

@1. First step
>  First body.
@1. Second step
>  Second body.

<!-- @case: three steps auto-increment -->

@1. Step A
@1. Step B
@1. Step C

<!-- @case: step with paragraph body -->

@1. Step one
>
>  First paragraph.
>
>  Second paragraph.

<!-- @case: step surrounded by paragraphs -->

Paragraph before.

@1. Step one
>  Body content.

Paragraph after.

<!-- @case: step with inline formatted title -->

@1. Install **Node.js** and `npm`
>  Follow the official guide.

<!-- @case: nested steps -->

@1. Outer step one
>  Outer body.
@@1. Inner step one
>  Inner body.
@@1. Inner step two
>  More inner body.
@1. Outer step two

<!-- @case: empty step -->

@1. Completed step
@1. Another step
>  Body here.

<!-- @case: manual numbering -->

@1. First
@3. Third skips to three
@4. Fourth

<!-- @case: body with blockquote -->

@1. Step with a blockquote
>
>  > This is a blockquote inside a step.
>  >
>  > It has multiple lines.

<!-- @case: body with unordered list -->

@1. Step with a list
>
>  - Item one
>  - Item two
>  - Item three

<!-- @case: body with ordered list -->

@1. Step with an ordered list
>
>  1. First item
>  2. Second item
>  3. Third item

<!-- @case: body with code fence -->

@1. Step with code
>
>  ```ts
>  const foo = "bar";
>  ```

<!-- @case: body with emphasis and strong -->

@1. Step with rich body
>
>  This has *emphasis* and **strong** text.

<!-- @case: body with horizontal rule -->

@1. Step one
>  Content before the rule.
@1. Step two
>  Content after.

<!-- @case: multiple nested steps with body -->

@1. Clone the repo
>
>  Run the following command:
>
>  ```sh
>  git clone https://github.com/example/repo.git
>  ```
@@1. Navigate to the directory
>  `cd repo`
@@1. Install dependencies
>  `npm install`
@1. Start the server
>  `npm start`

<!-- @case: step block followed immediately by heading -->

@1. Only step
>  Body.

## Heading after steps

<!-- @case: blank line between steps continues block -->

@1. Step one
>  Body.

@1. Step two from same block
>  Body.

<!-- @case: two independent step blocks separated by paragraph -->

@1. Block one step one
>  Body.

This paragraph separates the two blocks.

@1. Block two step one
>  Body.
@1. Block two step two

<!-- @case: bare continuation is blank body line -->

@1. Step one
> Line one.
>
> Line two after blank.
@1. Step two
> Content for step two.

<!-- @case: orphan blockquote before steps: no blank line, absorbed -->

> This blockquote has no blank line before the step header below it.
@1. Step one
> Content for step one.

<!-- @case: orphan blockquote before steps: blank line, steps render -->

> This blockquote is separated by a blank line.

@1. Step one
> Content for step one.
@1. Step two
> Content for step two.

<!-- @case: blockquote terminated by code fence, then steps -->

> This blockquote is terminated by the code fence that immediately follows it.
```js
const x = 1;
```
@1. Step one
> Content for step one.
@1. Step two
> Content for step two.

<!-- @case: blank line between adjacent step headers continues block -->

@1. Step one
> Content for step one.

@1. Step two
> Content for step two.

<!-- @case: depth-2 header with no depth-1 parent -->

@@1. Orphan
> Content here.

<!-- @case: depth skip from 1 to 3 terminates group -->

@1. Step one
@@@1. Too Deep
> Content here.

<!-- @case: no title text -->

@1.
> Content here.
