---
"@mirrordown/mdit-abbr": patch
"@mirrordown/mdit-attrs": patch
"@mirrordown/mdit-definition-list": patch
"@mirrordown/mdit-del": patch
"@mirrordown/mdit-github-alerts": patch
"@mirrordown/mdit-inline-svg": patch
"@mirrordown/mdit-ins": patch
"@mirrordown/mdit-kbd": patch
"@mirrordown/mdit-mark": patch
"@mirrordown/mdit-ruby": patch
"@mirrordown/mdit-steps": patch
"@mirrordown/mdit-sub": patch
"@mirrordown/mdit-sup": patch
"@mirrordown/mdit-tabs": patch
"@mirrordown/mdit-unwrap-images": patch
"@mirrordown/remd-abbr": patch
"@mirrordown/remd-attrs": patch
"@mirrordown/remd-definition-list": patch
"@mirrordown/remd-del": patch
"@mirrordown/remd-github-alerts": patch
"@mirrordown/remd-inline-svg": patch
"@mirrordown/remd-ins": patch
"@mirrordown/remd-kbd": patch
"@mirrordown/remd-mark": patch
"@mirrordown/remd-ruby": patch
"@mirrordown/remd-steps": patch
"@mirrordown/remd-sub": patch
"@mirrordown/remd-sup": patch
"@mirrordown/remd-tabs": patch
"@mirrordown/remd-unwrap-images": patch
---

fix: resolve `catalog:` protocol in published dependencies

0.1.0 was published with Yarn's `catalog:` specifier left literally in
`dependencies`/`devDependencies`, so consumers could not install the affected
packages. Packages are now packed with `yarn pack` (which resolves `catalog:`
to the concrete version ranges from `.yarnrc.yml`) before `npm publish`.
