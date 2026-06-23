# @saeris/mdit-github-alerts

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

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

```markdown
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
```

### Custom titles

Override the default title by adding text after the type marker:

```markdown
> [!NOTE] Custom Title
> This alert uses a custom title instead of the default.
```

### Foldable alerts

Use `+` to make an alert open by default, or `-` to make it collapsed by default:

```markdown
> [!TIP]+
> This tip is open by default.

> [!WARNING]-
> This warning is collapsed by default.
```

## Configuration

All options are passed when registering the plugin.

### Disable icons

Set `icons: false` to suppress the SVG icon from every alert title:

```markdown
> [!NOTE]
> This note has no icon.

> [!WARNING]
> This warning has no icon.
```

## Install

```ts
md.use(githubAlerts, { icons: false });
```

### Override default titles

Supply a `titles` map to replace the default heading text for any built-in type:

```markdown
> [!TIP]
> This is a pro tip.
```

## Install

```ts
md.use(githubAlerts, { titles: { tip: "Pro tip" } });
```

### Add custom alert types

Register new keywords with `types`. The value is the canonical type name that appears in the `data-alert` attribute and determines which CSS variable set applies. Style the new type with your own CSS:

## Install

```ts
md.use(githubAlerts, {
  types: { release: "release", changelog: "release" },
  titles: { release: "Release notes" }
});
```

```css
[data-alert="release"] {
  --markdown-alert-color: oklch(0.55 0.18 300);
}
```

## Usage

## Install

```sh
npm install @saeris/mdit-github-alerts
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { githubAlerts } from "@saeris/mdit-github-alerts";
import "@saeris/mdit-github-alerts/github-alerts.css";

const md = new MarkdownIt().use(githubAlerts);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { githubAlerts } from "@saeris/mdit-github-alerts";
import "@saeris/mdit-github-alerts/github-alerts.css";

export default defineConfig({
  markdown: {
    config: (md) => md.use(githubAlerts)
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/github-alerts](https://saeris.github.io/markdown/guide/plugins/github-alerts)

## License

MIT © [Drake Costa](https://saeris.gg)
