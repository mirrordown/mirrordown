---
"@mirrordown/mdit-mermaid-pele": minor
"@mirrordown/remd-mermaid-pele": minor
"@mirrordown/sat-mermaid-pele": minor
"markdown-mermaid-pele": minor
"@mirrordown/core": patch
---

Add the mermaid-pele plugin set: ` ```mermaid ` code blocks render to inline SVG at build time with [Pele](https://pele.run), so diagrams need no JavaScript on the page and no headless browser in the build, and they render in VSCode's preview. The API follows rehype-mermaid's (`prefix`, `errorFallback`, Mermaid `config` as `config`), with Pele's render options passed through; a diagram that fails to render fails the build at its line unless `errorFallback` handles it. Each diagram's ids are prefixed with a hash of its source (and a count for repeats), attributes on the fence (`{#id .class}`) go on the `<svg>`, and the stylesheet themes Pele's CSS variables from the page's `color-scheme`. The markdown-it, rehype and Sätteri plugins emit identical HTML.
