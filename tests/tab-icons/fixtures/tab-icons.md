<!-- @case: match: a keyword label -->

% npm
> npm install
% pnpm
> pnpm add
% yarn
> yarn add

<!-- @case: match: a keyword anywhere in the label, as a whole word -->

% Install with npm
> Body.
% invite
> No icon: `vite` is inside a word.

<!-- @case: match: camelCase, suffixes and file names -->

% VitePress
> Body.
% .npmrc
> Body.
% vite.config.ts
> Body.
% .env.local
> Body.
% app.tsx
> Body.

<!-- @case: match: no match leaves the label as it is -->

% Overview
> Body.

<!-- @case: match: of several keywords, the longest wins -->

% npm or pnpm
> Body.

<!-- @case: match: a keyword wins over an extension -->

% deno.json
> Body.

<!-- @case: marker: names the icon and leaves the label -->

% [!npm] Install
> Body.
% [!NPM] Case doesn't matter
> Body.

<!-- @case: marker: with nothing after it, the keyword is the label -->

% [!pnpm]
> Body.

<!-- @case: marker: none turns matching off -->

% [!none] Next steps
> Body.
% Next steps
> Matched: `next` is a whole word.

<!-- @case: marker: an unknown keyword stays text -->

% [!foo] Install
> Body.

<!-- @case: label: inline markdown keeps its icon -->

% Install with **npm**
> Body.

<!-- @case: nesting: a nested group's labels get icons -->

% JavaScript
> % npm
> > npm install
> % yarn
> > yarn add
% Rust
> cargo add
