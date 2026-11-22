import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownIt, remark, satteri } from "../presets/engines.js";

const dir = import.meta.dirname;

interface Task {
  char: string;
  checked: boolean;
}

/** One recorded case: the Markdown, and what Obsidian's Reading view made of it. */
interface Case {
  id: string;
  markdown: string;
  tags: string[];
  highlights: string[];
  tasks: Task[];
  blocks: string[];
  callouts: string[];
}

const corpus = JSON.parse(
  readFileSync(join(dir, "fixtures", "corpus.json"), "utf8")
) as { obsidian: string; cases: Case[] };

// The presets with the document-level transforms off, as in `tests/ofm`.
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
  mdit: markdownIt(options),
  remd: remark(options),
  sat: satteri(options)
};

const text = (html: string): string =>
  html
    .replaceAll(/<[^>]*>/g, ``)
    .replaceAll(`&lt;`, `<`)
    .replaceAll(`&gt;`, `>`)
    .replaceAll(`&quot;`, `"`)
    .replaceAll(`&amp;`, `&`)
    .replaceAll(/\s+/g, ` `);

// What each fact looks like in Obsidian's recording and in Mirrordown's HTML. A fact is compared as JSON, so the readers on both sides return plain data.
const facts: readonly {
  name: string;
  why: string;
  obsidian: (recorded: Case) => unknown;
  ours: (html: string) => unknown;
}[] = [
  {
    name: `tags`,
    why: `the tags a page shows are the tags its author sees in Obsidian`,
    obsidian: ({ tags }) => tags,
    ours: (html) =>
      [...html.matchAll(/<a class="tag" href="[^"]*">#([^<]*)<\/a>/g)].map(
        ([, name]) => name
      )
  },
  {
    name: `highlights`,
    why: `the same text is highlighted`,
    obsidian: ({ highlights }) => highlights.map((mark) => text(mark)),
    ours: (html) =>
      [...html.matchAll(/<mark\b[^>]*>([\s\S]*?)<\/mark>/g)].map(([, inner]) =>
        text(inner ?? ``)
      )
  },
  {
    name: `callouts`,
    why: `the same quotes are callouts, folded the same way`,
    obsidian: ({ callouts }) => callouts,
    // An alert is a `<div>`, or a `<details>` when foldable, open for `+`.
    ours: (html) =>
      [...html.matchAll(/<(div|details) class="markdown-alert"([^>]*)>/g)].map(
        ([, tag, rest]) =>
          tag === `div` ? `` : /\sopen\b/.test(rest ?? ``) ? `+` : `-`
      )
  },
  {
    name: `blocks`,
    why: `a link to a block finds the same identifiers its author can link to in Obsidian`,
    // Which identifiers a page has, not which element holds each: Obsidian records a source range, and here an identifier is an element's id.
    obsidian: ({ blocks }) => [...blocks].sort(),
    ours: (html) =>
      [...html.matchAll(/<[a-z][^>]*\sid="\^([^"]*)"/g)]
        .map(([, id]) => text(id ?? ``))
        .sort()
  }
];

/** Where Mirrordown and Obsidian differ on one fact: the count that agree, and each case that does not. `ours` is one value when the three engines agree with each other, else one per engine. */
interface Ledger {
  agree: number;
  differ: Record<
    string,
    { markdown: string; obsidian: unknown; ours: unknown }
  >;
}

// Every case through every engine, once: each fact reads the same HTML. An engine that throws on a case is recorded as having thrown, which no recorded fact equals.
const html = corpus.cases.map((recorded) =>
  Object.entries(engines).map(([engine, render]): [string, string | Error] => {
    try {
      return [engine, render(recorded.markdown)];
    } catch (error) {
      return [
        engine,
        error instanceof Error ? error : new Error(String(error))
      ];
    }
  })
);

const measure = (fact: (typeof facts)[number]): Ledger => {
  const ledger: Ledger = { agree: 0, differ: {} };
  for (const [index, recorded] of corpus.cases.entries()) {
    const theirs = fact.obsidian(recorded);
    const rendered = Object.fromEntries(
      (html[index] ?? []).map(([engine, output]) => [
        engine,
        output instanceof Error
          ? `threw: ${output.message.slice(0, 120)}`
          : fact.ours(output)
      ])
    );
    const values = Object.values(rendered).map((value) =>
      JSON.stringify(value)
    );
    const same = values.every((value) => value === values[0]);
    if (same && values[0] === JSON.stringify(theirs)) {
      ledger.agree++;
    } else {
      ledger.differ[recorded.id] = {
        markdown: recorded.markdown,
        obsidian: theirs,
        ours: same ? rendered.mdit : rendered
      };
    }
  }
  return ledger;
};

// Each fact is measured over every recorded case, and the result is kept in `expected/<fact>.json`: how many cases agree with Obsidian, and each one that does not. A change that moves a case in either direction fails here, so a set that claims to read Obsidian's syntax as Obsidian does is held to the app's own output, and a regression against it cannot pass unseen. `OBSIDIAN_UPDATE=1 vp test run tests/obsidian` rewrites the files; read the diff.
describe(`against Obsidian ${corpus.obsidian}, recorded`, () => {
  it.each(facts)("$name: $why", (fact) => {
    const path = join(dir, "expected", `${fact.name}.json`);
    const measured = measure(fact);
    if (process.env.OBSIDIAN_UPDATE) {
      writeFileSync(path, `${JSON.stringify(measured, null, 1)}\n`);
    }
    const expected = JSON.parse(readFileSync(path, "utf8")) as Ledger;
    expect(Object.keys(measured.differ)).toStrictEqual(
      Object.keys(expected.differ)
    );
    expect(measured).toStrictEqual(expected);
  });
});
