import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownIt, remark, satteri } from "../presets/engines.js";
import { normalizeHtml } from "../utils/index.js";
import { status } from "./status.js";

const dir = import.meta.dirname;
const expectedPath = join(dir, "expected", "ofm.html");

// The spec's examples, as CommonMark's `spec.txt` writes them: a fence of 32 backticks with the info string `example` (or `example minimal`), the Markdown, a line holding one `.`, the spec's HTML, and a closing fence. `→` stands for a tab. The input is taken exactly as written: one example depends on its leading blank line.
const FENCE = "`".repeat(32);
const examples = ((): { id: string; section: string; input: string }[] => {
  const lines = readFileSync(join(dir, "fixtures", "SPEC.md"), "utf8").split(
    /\r?\n/
  );
  const found: { id: string; section: string; input: string }[] = [];
  let section = ``;
  let number = ``;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ``;
    const heading = /^#{2,4} (.+)$/.exec(line);
    if (heading) section = heading[1] ?? ``;
    const label = /^\*\*Example (\d+)/.exec(line);
    if (label) number = label[1] ?? ``;
    if (!line.startsWith(`${FENCE} example`)) continue;
    const input: string[] = [];
    for (i++; i < lines.length && lines[i] !== `.`; i++) {
      input.push((lines[i] ?? ``).replaceAll(`→`, `\t`));
    }
    while (i < lines.length && lines[i] !== FENCE) i++;
    found.push({
      id: line.endsWith(`minimal`) ? `${number}-minimal` : number,
      section,
      input: input.join(`\n`)
    });
  }
  return found;
})();

// The presets with the document-level transforms off, so the HTML is the syntax's own: headings without sections and anchors, code blocks without buttons, a mermaid fence as code.
const options = {
  slug: false,
  autolinkHeadings: false,
  sectionize: false,
  copyCode: false,
  squeezeParagraphs: false,
  unwrapImages: false,
  lightbox: false,
  mermaidPele: false
} as const;
const engines = {
  "markdown-it": markdownIt(options),
  remark: remark(options),
  sätteri: satteri(options)
};
const rendered = examples.map((example) => ({
  ...example,
  html: Object.values(engines).map((render) => render(example.input))
}));

// `OFM_UPDATE=1 vp test run tests/ofm` rewrites the expected file from what the engines emit now, for the examples they agree on. Read the diff before committing it, and change an example's state in `status.ts` when its output now means something else.
const caseOf = (id: string): string => `<!-- @case: example-${id} -->`;
if (process.env.OFM_UPDATE) {
  writeFileSync(
    expectedPath,
    `${rendered
      .filter(({ id }) => status.get(id)?.differs === undefined)
      .map(({ id, html }) => `${caseOf(id)}\n${html[0] ?? ``}`)
      .join(`\n\n`)}\n`
  );
}
const expected = new Map(
  readFileSync(expectedPath, "utf8")
    .split(/<!--\s*@case:\s*example-(\S+)\s*-->/)
    .slice(1)
    .reduce<[string, string][]>(
      (pairs, part, index, parts) =>
        index % 2 === 0
          ? [...pairs, [part, normalizeHtml(parts[index + 1] ?? ``)]]
          : pairs,
      []
    )
);

describe("ofm", () => {
  // The ledger is only worth reading if it is complete: an example the spec adds, drops or renumbers has to be looked at.
  it("gives every example in the spec a status, and no other", () => {
    expect([...status.keys()].sort()).toStrictEqual(
      examples.map(({ id }) => id).sort()
    );
  });

  it("explains every status that is not `conforms`", () => {
    expect(
      [...status]
        .filter(([, { state, note }]) => state !== `conforms` && !note)
        .map(([id]) => id)
    ).toStrictEqual([]);
  });

  const agreeing = rendered.filter(
    ({ id }) => status.get(id)?.differs === undefined
  );
  const differing = rendered.filter(
    ({ id }) => status.get(id)?.differs !== undefined
  );

  // A change in what an Obsidian author's Markdown renders to is seen here first, in one place, whichever set caused it.
  it.each(agreeing)(
    "example $id ($section) renders the same in every engine, as recorded",
    ({ id, html }) => {
      expect(html).toStrictEqual(html.map(() => expected.get(id)));
    }
  );

  // A recorded engine difference that has closed must leave the ledger: remove `differs` and record the output.
  it.each(differing)(
    "example $id ($section) still differs between engines",
    ({ html }) => {
      expect(new Set(html).size).toBeGreaterThan(1);
    }
  );

  it("records no output for an example whose engines differ", () => {
    expect(
      differing.map(({ id }) => id).filter((id) => expected.has(id))
    ).toStrictEqual([]);
  });
});
