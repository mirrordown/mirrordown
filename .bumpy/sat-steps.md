---
"@mirrordown/core": minor
"@mirrordown/remd-steps": patch
"@mirrordown/sat-steps": minor
"@mirrordown/preset-satteri": minor
---

New `@mirrordown/sat-steps`: numbered step sequences (`@1. Title` with `>` bodies) for Sätteri, with the same output as `remd-steps` and `mdit-steps`, and included in `@mirrordown/preset-satteri` along with its stylesheet. Step recognition moves into `@mirrordown/core` (`processSteps`), which `remd-steps` now uses too; its output is unchanged.
