<!-- @case: a hard break in a panel stays one, before a header continues the paragraph -->

% Demo
> line\
> more
% Code
> b

<!-- @case: basic two tabs -->

% Tab One
> Content for tab one.
% Tab Two
> Content for tab two.

<!-- @case: three tabs first open by default -->

% npm
> ```sh
> npm install my-package
> ```
% pnpm
> ```sh
> pnpm add my-package
> ```
% yarn
> ```sh
> yarn add my-package
> ```

<!-- @case: explicit open tab with %+ -->

% Tab One
> Content for tab one.
%+ Tab Two
> Content for tab two.
% Tab Three
> Content for tab three.

<!-- @case: tab with multi-paragraph body -->

% Tab One
> First paragraph.
>
> Second paragraph.
% Tab Two
> Only paragraph.

<!-- @case: tab with code block body -->

% npm
> ```sh
> npm install
> ```
% pnpm
> ```sh
> pnpm add
> ```

<!-- @case: tabs followed by paragraph -->

% Tab One
> Content for tab one.
% Tab Two
> Content for tab two.

This paragraph is outside the tab group.

<!-- @case: nested tabs depth two -->

% Node.js
%% npm
> ```sh
> npm install
> ```
%% pnpm
> ```sh
> pnpm add
> ```
% Deno
> ```sh
> deno add my-package
> ```

<!-- @case: tab with inline markup in label -->

% **Bold** label
> Content here.
% `code` label
> Content here.

<!-- @case: single tab -->

% Only Tab
> Content here.

<!-- @case: bare continuation keeps block open -->

% Tab One
> Line one.
>
> Line two after blank.
% Tab Two
> Content for tab two.

<!-- @case: tab with table body -->

% Tab One
> | Col A | Col B |
> |-------|-------|
> | Cell  | Cell  |
% Tab Two
> Content for tab two.

<!-- @case: tab with nested blockquote body -->

% Tab One
> First paragraph.
>
> > This is a nested blockquote.
% Tab Two
> Content for tab two.

<!-- @case: orphan blockquote before tabs: no blank line, absorbed -->

> This blockquote has no blank line before the tab header below it.
% Tab One
> Content for tab one.

<!-- @case: orphan blockquote before tabs: blank line, tabs render -->

> This blockquote is separated by a blank line.

% Tab One
> Content for tab one.
% Tab Two
> Content for tab two.

<!-- @case: blockquote terminated by code fence, then tabs -->

> This blockquote is terminated by the code fence that immediately follows it.
```js
const x = 1;
```
% Tab One
> Content for tab one.
% Tab Two
> Content for tab two.

<!-- @case: blank line between tabs splits into two groups -->

% Tab One
> Content for tab one.

% Tab Two
> Content for tab two.

<!-- @case: tab with empty body -->

% Tab One
% Tab Two
> Content for tab two.

<!-- @case: explicit open on first tab is redundant -->

%+ Tab One
> Content for tab one.
% Tab Two
> Content for tab two.

<!-- @case: multiple explicit open markers -->

% Tab One
> Content for tab one.
%+ Tab Two
> Content for tab two.
%+ Tab Three
> Content for tab three.

<!-- @case: depth-2 header with no depth-1 parent -->

%% Orphan
> Content here.

<!-- @case: depth skip from 1 to 3 terminates group -->

% Tab One
%%% Too Deep
> Content here.

<!-- @case: no label text -->

%
> Content here.

<!-- @case: blockquote-depth nesting: > % pattern as children -->

% Demo
> % JavaScript
> > ```js
> > console.log("Hello");
> > ```
> % TypeScript
> > ```ts
> > const x: string = "Hello";
> > ```
% Code
> ````markdown
> % JavaScript
> > ```js
> > console.log("Hello");
> > ```
> % TypeScript
> > ```ts
> > const x: string = "Hello";
> > ```
> ````

<!-- @case: blockquote-depth nesting: explicit open via %+ inside > % -->

% Demo
> % Option A
> > ```sh
> > echo "not default"
> > ```
> %+ Option B
> > ```sh
> > echo "default"
> > ```
> % Option C
> > ```sh
> > echo "not default either"
> > ```
% Code
> ````markdown
> % Option A
> > ```sh
> > echo "not default"
> > ```
> %+ Option B
> > ```sh
> > echo "default"
> > ```
> % Option C
> > ```sh
> > echo "not default either"
> > ```
> ````

<!-- @case: > % with mixed %% depth-2 inside outer blockquote -->

% Demo
> % Frontend
> %% React
> > ```tsx
> > export function App() { return <h1>Hello</h1>; }
> > ```
> %% Vue
> > ```vue
> > <template><h1>Hello</h1></template>
> > ```
> % Backend
> > ```sh
> > node server.js
> > ```
% Code
> ````markdown
> % Frontend
> %% React
> > ```tsx
> > export function App() { return <h1>Hello</h1>; }
> > ```
> %% Vue
> > ```vue
> > <template><h1>Hello</h1></template>
> > ```
> % Backend
> > ```sh
> > node server.js
> > ```
> ````

<!-- @case: flat %% nesting after % with body (usage section pattern) -->

% Remark
> Install the package.
%% Unified
> ```ts
> unified();
> ```
%% Astro
> ```ts
> defineConfig();
> ```
% Markdown-It
> Install the package.
%% Standalone
> ```ts
> new MarkdownIt();
> ```

<!-- @case: a tab header after a depth skip starts a new group -->

% Tab One
%%% Too Deep
% Tab Two
> Content for tab two.

<!-- @case: a label's markup, escapes and entities stay out of its group id and aria-label -->

% [Link](https://example.com) \& `code`
> a
% A &amp; B
> b

<!-- @case: tabs directly after a list marker -->

- % One
  > First.
  % Two
  > Second.

<!-- @case: a tab header lazily continued into a nested panel belongs to the outer group -->

% Demo
> % Option A
> > Not selected.
> %+ Option B
> > Selected.
% Code
> The source.

<!-- @case: lines after a lazily continued tab header keep their blockquotes -->

% Demo
> % A
> > a
% Code
> Text.
> > Quoted.

<!-- @case: a header that skips a level in an explicit body stays in the panel as text -->

% Demo
> %% A
> > a
% Code
> code

<!-- @case: a skipped header after a nested group stays in the panel after it -->

% Demo
> % A
> > a
> %%% Deep
> > deep
% Code
> code

<!-- @case: a header that skips a level in a tab body ends the group -->

% A
> a
%%% Deep
> b

<!-- @case: a depth skip ends the group, and the tabs after it stay in its blockquote -->

% A
> a
%%% Deep
> b
% B
> c

<!-- @case: a nested depth skip ends the whole group -->

% Outer
%% Inner
> x
%%%% Deep
> y
% Two
> z
