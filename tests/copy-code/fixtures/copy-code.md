<!-- @case: fence with a language -->
```sh
npm install @mirrordown/mdit-copy-code
```

<!-- @case: fence without a language -->
```
plain text
```

<!-- @case: indented code block -->
An indented block:

    indented code

<!-- @case: several lines, without the last newline copied -->
```js
const a = 1;
const b = 2;
```

<!-- @case: nocopy turns the button off -->
```sh nocopy
rm -rf build
```

<!-- @case: nocopy among other meta words -->
```js title="demo.js" nocopy
console.log("hi");
```

<!-- @case: a word containing nocopy doesn't turn it off -->
```sh nocopying
echo kept
```

<!-- @case: repeated blocks get numbered ids -->
```sh
echo same
```

```sh
echo same
```

```bash
echo same
```

<!-- @case: an empty block gets no button -->
```sh
```

<!-- @case: special characters are escaped, and the id hashes the text -->
```html
<a href="?a=1&b=2">"quoted"</a>
```

<!-- @case: in a blockquote -->
> ```sh
> echo quoted
> ```

<!-- @case: in a list item -->
- Install:

  ```sh
  echo listed
  ```

<!-- @case: inline code gets no button -->
Run `npm test` first.

<!-- @case: the ids restart for each document -->
```sh
echo same
```
