# @mirrordown/mdit-github-alerts

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A markdown-it plugin for the `github-alerts` syntax extension.

## Overview

The `github-alerts` plugin converts GitHub-style alert blockquotes (`> [!NOTE]`, `> [!WARNING]`, etc.) into styled `<div>` containers with an icon and title. Foldable alerts are rendered as `<details>` elements.

```html
<div class="markdown-alert" data-alert="note">
  <p class="markdown-alert-title">Note</p>
  <p>...</p>
</div>
```

## Syntax

Write a blockquote with a `[!TYPE]` marker on the first line:

````markdown
> [!NOTE]
> Useful information that users should know, even if skimming.

> [!TIP]
> Helpful advice for getting things done more effectively.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.
````

The keyword is read in any case (`[!note]` is a note). A backslash before the marker (`> \[!NOTE]`) leaves the quote a quote, with the marker as text.

### Custom titles

Override the default title by adding text after the type marker. Everything after the marker on that line is the title, and it can use inline formatting; the body starts on the next line. Emphasis, a code span or a link that opens in the title and closes on a later line takes the title with it, to the end of the line it closes on:

````markdown
> [!NOTE] Custom *Title*
> This alert uses a custom title instead of the default.
````

### Foldable alerts

Use `+` to make an alert open by default, or `-` to make it collapsed by default:

````markdown
> [!TIP]+
> This tip is open by default.

> [!WARNING]-
> This warning is collapsed by default.
````

### Attributes

With the [`attrs`](/guide/plugins/attrs) plugin, or Sätteri's built-in `attributes` feature, an alert takes attribute blocks the way a blockquote does. A block on a line after the alert, written without the `>`, goes on the alert. Written with the `>`, it goes on the body's last paragraph. A block touching an inline element in the title goes on that element and is left out of the title's label.

````markdown
> [!NOTE] An *important*{.loud} note
> The body.
{#setup-note .wide}
````

List the attrs plugin after the alerts plugin. The engines differ in three places:

- A block after a blank line (`> [!NOTE]`, the body, a blank line, then `{#setup-note}`) goes on the alert in markdown-it and remark. Sätteri reads that line as an empty paragraph of its own, so use the form above there.
- A block that ends the title line, as in `> [!NOTE] Title {.wide}`, goes on the title in markdown-it and is printed as text in remark and Sätteri. Put the block on its own line instead.
- An alert with no body takes a block from the next line only on Sätteri. In markdown-it and remark, `> [!NOTE]` followed by `{.wide}` leaves an empty paragraph inside the alert.

## Configuration

All options are passed when registering the plugin.

### Disable icons

Set `icons: false` to suppress the SVG icon from every alert title:

````markdown
> [!NOTE]
> This note has no icon.

> [!WARNING]
> This warning has no icon.
````

```ts
md.use(githubAlerts, { icons: false })
```

### Override default titles

Supply a `titles` map to replace the default heading text for any built-in type:

````markdown
> [!TIP]
> This is a pro tip.
````

```ts
md.use(githubAlerts, { titles: { tip: "Pro tip" } })
```

### Add custom alert types

Register new keywords with `types`. The value is the canonical type name that appears in the `data-alert` attribute and determines which CSS variable set applies. Style the new type with your own CSS:

```ts
md.use(githubAlerts, {
  types: { release: "release", changelog: "release" },
  titles: { release: "Release notes" },
})
```
```css
[data-alert="release"] {
  --markdown-alert-color: oklch(0.55 0.18 300);
}
```

### Other options

| Option | Default | |
| --- | --- | --- |
| `matchCaseInsensitive` | `true` | `false` reads a keyword only as it is registered: the built-in keywords are lowercase, so `[!note]` is an alert and `[!NOTE]` is not. |
| `containerClass` | `"markdown-alert"` | The alert's class, which also starts the title's (`-title`). The stylesheet targets the default. |

## Install

```sh
npm install @mirrordown/mdit-github-alerts
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { githubAlerts } from "@mirrordown/mdit-github-alerts";
import "@mirrordown/mdit-github-alerts/styles";

const md = new MarkdownIt().use(githubAlerts);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { githubAlerts } from "@mirrordown/mdit-github-alerts";
import "@mirrordown/mdit-github-alerts/styles";

export default defineConfig({
  markdown: {
    config: (md) => md.use(githubAlerts),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
