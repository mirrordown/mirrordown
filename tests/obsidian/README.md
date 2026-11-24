# Against Obsidian itself

This folder measures Mirrordown's reading of Obsidian's syntax against what the Obsidian application rendered, not against a description of it.

## What is here

- `fixtures/corpus.json` holds 3,471 Markdown cases and what Obsidian 1.15.0's Reading view made of each: the tags it linked, the text it highlighted, its task boxes, its callouts and the blocks it named. The recordings were made by [quartz-community/remark-obsidian](https://github.com/quartz-community/remark-obsidian), whose harness renders a generated corpus inside the real application; this file is those recordings (`test/parity/goldens/obsidian.json` at commit `571e898`, recorded 8 November 2026), reduced to the facts compared here. They are © their authors under the MIT license in `fixtures/LICENSE-remark-obsidian`.
- `obsidian.test.ts` renders every case through the three presets and reads the same facts out of Mirrordown's HTML.
- `expected/<fact>.json` records, for each fact, how many cases agree with Obsidian and every case that does not, with both readings.

## What it is for

`tests/ofm` follows a written spec of Obsidian Flavored Markdown, and a spec has to guess where Obsidian is undocumented. This folder holds the answer the application gave. A plugin set that reads Obsidian's syntax can be held to it, and the count of agreeing cases is a number to report.

The test fails when a case moves in either direction: a change that makes Mirrordown agree with Obsidian on a new case has to record it, and a change that breaks an agreeing case cannot pass unseen.

## What it is not

Agreement with Obsidian is not the goal in every case. Obsidian's Reading view is built on an old parser, remark-parse 8, and departs from CommonMark in ways its own team calls bugs: a tag read straight after bold text, `===text==` highlighting `=text`. Mirrordown follows what Obsidian documents and intends. A case listed in an `expected` file is a difference, not a defect; the plan is to sort each into a reason as the sets that touch it are built.

Syntax Mirrordown does not have yet (wikilinks, comments, math) shows up as differences in the facts it sits inside.

## Updating

```sh
OBSIDIAN_UPDATE=1 vp test run tests/obsidian
```

Read the diff of the `expected` files: every case that left or joined a list is a change in what an Obsidian author's page looks like.

To move to a newer recording, run `node scripts/generate-obsidian-corpus.mjs <path to remark-obsidian>/test/parity/goldens/obsidian.json <commit>`, change the commit and date above, and update.
