---
"@mirrordown/core": minor
"@mirrordown/mdit-tabs": minor
"@mirrordown/remd-tabs": minor
"markdown-tabs": minor
---

Tab labels behave the same in every engine:

- `remd-tabs` keeps a tab's label in the tree, as a `tabsLabel` node that is the first child of each `tabsItem` (the `label` field is gone), so remark plugins that run after it also apply to the label, and a panel's `aria-label` is the label's final text.
- `data-tabs-group` hashes each label's plain text without a trailing attrs block, as the tabs specification describes. `mdit-tabs` hashed the raw markdown, so labels with links, images, entities or escapes got different ids in markdown-it and remark; labels with a trailing `{…}` change id in both.
- `mdit-tabs` escapes a panel's `aria-label` once: `npm & yarn` rendered as `aria-label="npm &amp;amp; yarn"`.
- `mdit-tabs` nests its panel tokens inside the tabs tokens, so `mdit-sectionize` no longer opens a `<section>` around a heading in a tab panel that closed outside the panel.
