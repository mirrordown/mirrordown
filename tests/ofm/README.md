# Obsidian Flavored Markdown examples

This folder tracks what Mirrordown renders for Markdown written in Obsidian. It runs every example of an independent Obsidian Flavored Markdown (OFM) spec through the three presets and records the result.

## What is here

- `fixtures/SPEC.md` is the spec, copied unchanged from [gordonbrander/obsidian-markdown](https://github.com/gordonbrander/obsidian-markdown) at commit `2c3049f203af5e0a7c6bd0cbe5b378bb7f4dffac` (version 0.2, 16 November 2026). It is © 2026 Gordon Brander under the MIT license in `fixtures/LICENSE-MIT`. It is unofficial and not endorsed by Obsidian, and it marks many of its own rules as chosen where Obsidian's behaviour is undocumented.
- `status.ts` says where Mirrordown stands on each example: it conforms, a planned change will handle it, it is deferred, it differs on purpose, or it is out of scope. It also lists the examples the three engines render differently, with the reason.
- `expected/ofm.html` holds the HTML the three engines emit for every example they agree on. It is Mirrordown's own markup, not the spec's: the spec requires elements, not Obsidian's class names.
- `ofm.test.ts` reads the examples straight from the spec, so their input is exact.

## What the test catches

- An example whose output changes in any engine. That is the point of the folder: a new plugin set changes what an Obsidian author's page looks like, and this is the one place that shows it.
- An engine difference that closes. The example then has to leave the list of differences and get a recorded output.
- An example the spec adds, drops or renumbers.

## Updating

When a change is meant to alter these outputs:

```sh
OFM_UPDATE=1 vp test run tests/ofm
```

Read the diff of `expected/ofm.html`, then update each affected example's state in `status.ts`. The test does not judge whether an output conforms to the spec; a person does, once, and records it there.

To move to a newer spec, replace `fixtures/SPEC.md`, change the commit above, run the update, and give every new example a status.
