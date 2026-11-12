# @mirrordown/remd-steps

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A remark/rehype (unified) plugin for the `steps` syntax extension.

## Overview

The `steps` plugin converts `@N.`-prefixed headers and `>`-prefixed blockquote bodies into styled ordered step lists. Depth is controlled by repeating the `@` character.

```html
<ol class="markdown-steps">
  <li class="markdown-steps-item" data-step="1">
    <p class="markdown-steps-title">Step title</p>
    <div class="markdown-steps-body">...</div>
  </li>
</ol>
```

## Syntax

Write `@1. Title` lines followed by `>` blockquote bodies for each step:

````markdown
@1. Install dependencies
> ```sh
> npm install
> ```
@2. Configure your environment
> Copy `.env.example` to `.env` and fill in your values.
@3. Start the development server
> ```sh
> npm run dev
> ```
````

### Step titles are optional

Steps can have no title — just a body:

````markdown
@1.
> First thing to do.
@2.
> Second thing to do.
````

### Nested steps

Use `@@` to nest steps inside a parent step:

````markdown
@1. Set up the project
@@1. Create a new directory
> ```sh
> mkdir my-project && cd my-project
> ```
@@2. Initialize git
> ```sh
> git init
> ```
@2. Install dependencies
> ```sh
> npm install
> ```
````

### Things to know

- Steps are numbered in the order they are written: the number in `@N.` is not read, so `@1.` on every step, or `@3.` after `@1.`, renders 1, 2, 3.
- A header is one line. Spaces at its end are not part of the title and make no line break, and a backslash at its end is a literal backslash.
- Steps nest six levels deep (`@@@@@@`), one level at a time. A header that skips a level (`@@@` under `@`) or has more than six `@` is not a header, and neither is a first header deeper than `@`.
- A blank line inside a body needs the body's `>`. Written without it, the blank line ends the blocks before it (a list or a code fence does not continue across it), though the body itself goes on with the next `>` line.
- A line that is neither a header nor a `>` line ends the steps. In a list item, write headers at the indentation of the item's content: a line written short of it continues the paragraph before it as text, as it does in CommonMark, whether it is a header or not. Where no paragraph is open for it to continue (after a code fence, say), such a line ends the item.
- Directly after a header, write a `>` line, another header or a blank line. remark and Sätteri read any other line as CommonMark does, together with the header: a `===` or `---` underline makes the header a heading, and a line that cannot interrupt a paragraph (a list item numbered other than 1, indented code, a link reference definition) stays text after the steps. markdown-it reads the header first, so there the steps end and the line is read on its own (as a list, code, a definition, a thematic break).
- In a blockquote, a line written without any `>` leaves the blockquote. Between two steps, markdown-it ends the blockquote at that line and starts another for the steps after it, while remark and Sätteri keep the line and those steps in the one blockquote.
- With the tabs plugin, leave a blank line between a tab group and a step header after it: directly under the last panel, the header starts steps in markdown-it and stays text in remark and Sätteri.
- A `>` indented four columns or more is not a body's marker, as it is no blockquote's in CommonMark: the line continues the paragraph before it as text (directly after a header, that ends the steps), and after a blank line it is indented code.
- An alert in a step's body is written as a nested quote (`> > [!NOTE]`). After a blank line, a quote that starts with an alert marker at the body's own level (`> [!NOTE]`) is an alert of its own and ends the steps. Directly under a header, that same line is the first line of the body, as text. In remark and Sätteri that needs the alerts plugin listed after this one, as the presets list it: listed before, it has already made the quote an alert, which then follows the steps.
- With the [`attrs`](/guide/plugins/attrs) plugin, attributes at the end of a header go on its step, and a block on the line after the steps goes on the list. After a blank line, markdown-it and remark still put that block on the list, while Sätteri reads it as an empty paragraph of its own.
- A backslash before the `@` (`\@1.`) writes the line as text.
- The stylesheet targets the default container class, `markdown-steps`. The `containerClass` option names another, which also starts the other classes (`-item`, `-title`, `-body`, `-list`); with it the steps are yours to style.
- `remarkSteps` reads each line's `>` markers from the file's source, so it needs a tree parsed from that same file with positions, as `remark-parse` produces. On a tree built another way, a header or the end of the steps that depends on those markers is not recognized.

## Install

Install `@mirrordown/remd-steps`. You must also pass `stepsHastHandlers` to `remarkRehype` and import the stylesheet. If you use the alerts plugin, list this one before it:

```sh
npm install @mirrordown/remd-steps
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkSteps, stepsHastHandlers } from "@mirrordown/remd-steps";
import "@mirrordown/remd-steps/steps.css";

const processor = unified()
  .use(remarkParse)
  .use(remarkSteps)
  .use(remarkRehype, { handlers: stepsHastHandlers })
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkSteps, stepsHastHandlers } from "@mirrordown/remd-steps";
import "@mirrordown/remd-steps/steps.css";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkSteps],
    remarkRehype: { handlers: stepsHastHandlers },
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
