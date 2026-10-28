---
"@mirrordown/preset-markdown-it": minor
"@mirrordown/preset-remark": minor
"@mirrordown/preset-satteri": minor
---

Add `mermaidPele`, on by default like every other feature: ` ```mermaid ` code blocks render to inline SVG with Pele, and the presets' stylesheets include its theme. With remark, stringify with `allowDangerousHtml: true` (Astro already does); in Astro, leave `mermaid` out of highlighting with `syntaxHighlight: { type: "shiki", excludeLangs: ["mermaid"] }`, since Astro highlights code blocks before the plugins run.
