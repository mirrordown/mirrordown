# @mirrordown/mdit-lightbox

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A markdown-it plugin that opts an image into a click-to-zoom lightbox — with **no JavaScript**.

## Overview

Opt an image in with a leading `!!`:

```markdown
!![A wild rice field](./wild-rice.jpg "Wild rice")
```

The marked image becomes a trigger that opens the full-size image in a modal `<dialog>`, dimming and blurring the page behind it. Unmarked images (`![…]`) render normally. The entire interaction — open, close, backdrop dismiss, `Esc`, and the zoom/fade animation — is built from modern declarative HTML and CSS only: `<dialog>`, the Invoker Commands API (`command`/`commandfor`), `closedby="any"`, and `@starting-style`. That makes it work in environments that disable scripts, such as the VSCode Markdown preview.

Click the image to zoom; click it again, click the backdrop, or press `Esc` to close. In renderers without the plugin, the extra `!` renders as plain text and the image still shows.

## Install

```sh
npm install @mirrordown/mdit-lightbox
```

## Usage

```ts
import MarkdownIt from "markdown-it";
import { lightbox } from "@mirrordown/mdit-lightbox";
import "@mirrordown/mdit-lightbox/styles";

const md = MarkdownIt().use(lightbox);

md.render('!![A wild rice field](./wild-rice.jpg "Wild rice")');
```

The plugin renders each opted-in image as an inline trigger button and emits the
matching `<dialog>` elements at the end of the document (a `<dialog>` cannot be
nested in the paragraph that wraps an inline image). Import
`@mirrordown/mdit-lightbox/styles` for the default look.

## Behavior

- **Repeated images share one dialog.** The dialog `id` is a stable hash of the
  image `src`, so referencing the same image more than once produces a single
  dialog that every trigger opens — not a duplicate per reference.
- **Name a lightbox with `{#id}`.** With
  [markdown-it-attrs](https://www.npmjs.com/package/@mirrordown/mdit-attrs) (or
  any compatible attrs plugin), `!![Alt](photo.jpg){#hero}` uses `hero` as the
  dialog `id` instead of the hashed default.
- **Images inside a link are skipped.** A `<button>` can't nest in an `<a>`, so
  a linked image (`[!![Alt](photo.jpg)](/page)`) renders as a normal linked
  image and the `!` stays literal.

## Customization

The stylesheet exposes public custom properties:

| Property                       | Default           | Description                      |
| ------------------------------ | ----------------- | -------------------------------- |
| `--markdown-lightbox-backdrop` | `rgb(0 0 0 /72%)` | Backdrop color behind the image. |
| `--markdown-lightbox-blur`     | `3px`             | Backdrop blur radius.            |
| `--markdown-lightbox-radius`   | `0.375rem`        | Image corner radius.             |
| `--markdown-lightbox-duration` | `0.25s`           | Open/close transition duration.  |

## Browser support

Requires `command`/`commandfor`, `<dialog closedby>`, and `@starting-style`
(Chromium 135+ and equivalent). Where unsupported, images degrade to a plain,
non-zooming thumbnail.

## License

MIT © [Drake Costa](https://saeris.gg)
