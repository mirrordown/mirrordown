<!-- @case: a prompt, closed, with the default services -->
```prompt
Read <https://example.com/docs/setup> and update `vite.config.ts`.
```

<!-- @case: open shows the prompt -->
```prompt open
Summarize this page.
```

<!-- @case: a title, in double quotes -->
```prompt title="Set up the project"
Install the package.
```

<!-- @case: a title, in single quotes, with the services after it -->
```prompt title='Ask about "tabs"' cursor
How do tabs work?
```

<!-- @case: a one-word title without quotes -->
```prompt title=Setup open
Install it.
```

<!-- @case: the services the meta names, in its order -->
```prompt cursor claude github-copilot grok
Refactor this.
```

<!-- @case: unknown words are ignored, and a service named twice shows once -->
```prompt claude nonsense claude
Hello.
```

<!-- @case: services that can't take the prompt open for the reader to paste it -->
```prompt gemini perplexity copilot mistral
Explain closures.
```

<!-- @case: markdown, markup and quotes in the prompt are escaped, in the body and the forms -->
```prompt chatgpt
# Task

1. Read <PROJECT_NAME>'s `README.md` & "docs".
2. Run `pnpm build`.
```

<!-- @case: the same prompt twice gets two ids -->
```prompt
Same.
```

```prompt
Same.
```

<!-- @case: an empty prompt stays a code block -->
```prompt
```

<!-- @case: another language stays a code block -->
```js open
const a = 1;
```

<!-- @case: a tilde fence -->
~~~prompt claude
Tilde.
~~~

<!-- @case: in a list item -->
- Ask your agent:

  ```prompt open
  Indented.
  ```

<!-- @case: in a blockquote -->
> ```prompt
> Quoted.
> ```

<!-- @case: a prompt in a prompt stays a code block in the preview -->
````prompt open
Use this prompt:

```prompt
Inner.
```
````

<!-- @case: invisible characters: a warning, the markdown view first, and each one marked there -->
```prompt
Say​ hi.󠁨󠁩
```

<!-- @case: markdown in a quoted prompt's preview -->
> ```prompt open
> # Steps
>
> 1. Read **`AGENTS.md`**.
> 2. ==Ask== before \==guessing==.
> ```

<!-- @case: a link definition in a prompt is the prompt's: the page's text can't link through it -->
See [docs].

```prompt open
[docs]: https://prompt.example

Read the [docs].
```

<!-- @case: a link definition on the page is the page's: a prompt's text can't link through it -->
[guide]: https://page.example

The [guide].

```prompt open
Read the [guide].
```
