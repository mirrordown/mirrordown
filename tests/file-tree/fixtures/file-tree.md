<!-- @case: indented names -->
```filetree
src/
  index.ts
  utils.ts
package.json
```

<!-- @case: the same tree as the tree command draws it -->
```filetree
.
├── src/
│   ├── index.ts
│   └── utils.ts
└── package.json

1 directory, 3 files
```

<!-- @case: tree --charset=ascii -->
```filetree
.
|-- src/
|   |-- index.ts
|   `-- utils.ts
`-- package.json
```

<!-- @case: list markers, as Starlight and Vocs write trees -->
```filetree
- src/
  - index.ts
  * utils.ts
- package.json
```

<!-- @case: a folder is a row with children, slash or not -->
```filetree
src
  lib
    index.ts
```

<!-- @case: comments after # or // -->
```filetree
src/            # the source
  index.ts      // the entry point
  issue #12.md
  C#.cs
notes.md #not-a-comment
```

<!-- @case: highlighted rows -->
```filetree
src/
  **index.ts**
**package.json** # read this first
```

<!-- @case: git status, with a folder marking the changes it holds -->
```filetree
src/
  added.ts [A]
  modified.ts [M]
  deleted.ts [D]
  renamed.ts [R]
  untracked.ts [U]
  **changed.ts** [M] # highlighted and modified
.env [I]
```

<!-- @case: a folder written name/… starts closed -->
```filetree
node_modules/…
dist/...
  index.js
src/
  index.ts
```

<!-- @case: placeholders -->
```filetree
src/
  index.ts
  ...
…
```

<!-- @case: an empty folder -->
```filetree
public/
src/
  index.ts
```

<!-- @case: a path on one row -->
```filetree
src/components/
  Button.tsx
src/lib/utils.ts
```

<!-- @case: names with spaces, and SvelteKit's + names -->
```filetree
src/routes/
  +page.svelte
  +layout.ts
My Documents/
  Read Me.txt
```

<!-- @case: uneven indentation nests under the nearest shallower row -->
```filetree
a/
    b/
        c.ts
  d.ts
e.ts
```

<!-- @case: tabs -->
```filetree
src/
	index.ts
	lib/
		utils.ts
```

<!-- @case: a named root -->
```filetree
my-app/
├── src/
│   └── main.ts
└── README.md
```

<!-- @case: names are text -->
```filetree
<script>.js
a & b.md # x < y
```

<!-- @case: icons by name, extension and part of a name -->
```filetree
README.md
Dockerfile
.gitignore
tsconfig.json
vite.config.ts
types.d.ts
photo.PNG
unknown.xyz
LICENSE
```

<!-- @case: an empty fence stays a code block -->
```filetree
```

<!-- @case: other languages stay code blocks -->
```text
src/
  index.ts
```

<!-- @case: in a list item and a blockquote -->
- A project:

  ```filetree
  src/
    index.ts
  ```

> ```filetree
> README.md
> ```
