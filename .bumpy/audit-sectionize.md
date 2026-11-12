---
"@mirrordown/mdit-sectionize": patch
"@mirrordown/remd-sectionize": patch
"@mirrordown/sat-sectionize": patch
---

A heading that comes before a shallower one is now wrapped in a section, as the guide says every heading is: `#### Deep` then `## Shallow`, or `### C` inside `# A` before `## B`. Documents whose headings only go deeper are unchanged.
