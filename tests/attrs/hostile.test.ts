import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import type { Node, Parent } from "unist";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import {
  HOSTILE_TIME_LIMIT,
  comparable,
  hostileCases
} from "../utils/hostile.js";
import { normalizeHtml } from "../utils/index.js";

// The three engines, with attribute blocks read or not: the plugin's own cost is the difference. Sätteri reads blocks itself, through its `attributes` feature.
const pipelines = (on: boolean): ((input: string) => string)[] => {
  const md = new MarkdownIt();
  if (on) md.use(attrs);
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(on ? [remarkAttrs] : [])
    .use(remarkRehype)
    .use(rehypeStringify);
  return [
    (input) => md.render(input),
    (input) => String(processor.processSync(input)),
    (input) =>
      markdownToHtml(input, {
        features: { gfm: true, attributes: on, smartPunctuation: false }
      }).html
  ];
};
const withPlugin = pipelines(true);
const bare = pipelines(false);
const MDIT = 0;
const REMD = 1;
const SAT = 2;

const timed = (run: () => void): number => {
  const started = performance.now();
  run();
  return performance.now() - started;
};

// The fastest of three runs: a pause for garbage collection only ever makes one slower.
const fastest = (run: () => void): number =>
  Math.min(timed(run), timed(run), timed(run));

const fails = (run: () => void): boolean => {
  try {
    run();
    return false;
  } catch {
    return true;
  }
};

// How much longer each engine takes with the plugin, rendering `input`, and whether the plugin made it fail.
const ownCost = (
  input: string,
  engines = [MDIT, REMD, SAT]
): { costs: number[]; failed: number } => {
  const costs: number[] = [];
  let failed = 0;
  for (const index of engines) {
    let alone = false;
    let broken = false;
    const without = timed(() => {
      alone = fails(() => bare[index](input));
    });
    const withIt = timed(() => {
      broken = fails(() => withPlugin[index](input));
    });
    if (broken && !alone) failed++;
    costs.push(alone ? 0 : withIt - without);
  }
  return { costs, failed };
};

const html = (input: string): string[] =>
  withPlugin.map((render) => comparable(normalizeHtml(render(input))));

// Input an author would never write on purpose still arrives: pasted logs, generated files, text from another system. None of it may throw, hang, or make the engines disagree.
describe("hostile input through attrs", () => {
  it.each(hostileCases((text) => `${text} {.c}`, `{`))(
    "before a block: $name",
    ({ input }) => {
      const { costs, failed } = ownCost(input);
      expect(failed).toBe(0);
      expect(Math.max(...costs)).toBeLessThan(HOSTILE_TIME_LIMIT);
      const out = html(input);
      expect(out).toStrictEqual(out.map(() => out[0]));
    }
  );

  // Two of these meet differences the guide lists, so they are held to not throwing and the time limit only: Sätteri reads no block that holds a backtick, and markdown-it and remark have read `__proto__`'s underscores as emphasis before a block is read.
  const differ = new Set(["replacement patterns", "__proto__"]);
  it.each(hostileCases((text) => `text {title="${text}"}`, `}`))(
    "in a quoted value: $name",
    ({ name, input }) => {
      const { costs, failed } = ownCost(input);
      expect(failed).toBe(0);
      expect(Math.max(...costs)).toBeLessThan(HOSTILE_TIME_LIMIT);
      const out = html(input);
      if (!differ.has(name)) expect(out).toStrictEqual(out.map(() => out[0]));
    }
  );
});

interface Many {
  name: string;
  make: (n: number) => string;
  /** Sätteri leaves a line ending at the end of a setext heading's content when a block is on the line before the underline, as the guide lists. */
  satteriDiffers?: true;
  /** How many remark's plugin is timed on, when remark's own parser can't reach 20,000 in reasonable time. */
  remarkSize?: number;
}

// Every kind of block the plugins place, many times over. markdown-it once split the whole document into lines again for each block on a line of its own, walked back over a list's or blockquote's earlier children for each one in it, and dropped each block's emptied text from the paragraph one at a time: 20,000 image paragraphs took 27 seconds. remark's plugin did the last too, read every item of a list again per block to tell whether the list was loose or held a task item, and walked the tree with `unist-util-visit`, which finds each node's index among its siblings with `indexOf`.
const many: Many[] = [
  {
    name: "paragraphs, each with a block on a line of its own",
    make: (n) => "para\n{.c}\n\n".repeat(n)
  },
  {
    name: "image paragraphs, each with a block on a line of its own",
    make: (n) => "![a](a.png)\n{.c}\n\n".repeat(n)
  },
  {
    name: "items of one list, each with a block on a line of its own",
    make: (n) => "- item\n  {.c}\n".repeat(n)
  },
  {
    name: "items of one list, each with a block on a line written outside it",
    make: (n) => "- item\n{.c}\n".repeat(n)
  },
  {
    name: "setext headings, each with a block on a line of its own",
    make: (n) => "Title\n{.c}\n---\n\n".repeat(n),
    satteriDiffers: true
  },
  {
    name: "blockquotes, each with a block on a line of its own",
    make: (n) => "> quote\n> {.c}\n\n".repeat(n)
  },
  {
    name: "paragraphs of one blockquote, each with a block on a line of its own",
    make: (n) => "> quote\n> {.c}\n>\n".repeat(n)
  },
  {
    name: "paragraphs, each ending in a block",
    make: (n) => "para {.c}\n\n".repeat(n)
  },
  {
    name: "inline blocks in one paragraph",
    make: (n) => "*a*{.c}".repeat(n)
  },
  {
    name: "image blocks in one paragraph",
    make: (n) => "![a](a.png){.c}".repeat(n)
  },
  // markdown-it and remark once removed each of these paragraphs on the spot, which moved every later block once per paragraph.
  {
    name: "tables, each followed by a block in a paragraph of its own",
    make: (n) => "| a |\n|---|\n| b |\n\n{.t}\n\n".repeat(n),
    // remark-gfm takes longer than linear to parse many tables by itself: 2.7 seconds for 2,000.
    remarkSize: 2000
  },
  {
    name: "lists, each followed by a block in a paragraph of its own",
    make: (n) => "- a\n\n{.l}\n\n".repeat(n)
  },
  {
    // Text first: Sätteri reads a document that opens with `---` and has another `---` line as front matter.
    name: "rules, each followed by a block in a paragraph of its own",
    make: (n) => `text\n\n${"---\n\n{.h}\n\n".repeat(n)}`
  }
];

const parser = unified().use(remarkParse).use(remarkGfm);

describe("many blocks through attrs", () => {
  // remark's plugin is timed on its own, on a tree parsed beforehand: remark's parser and remark-rehype take longer than linear by themselves on one long list or paragraph (seconds, for 20,000 list items), and a difference between two such times measures nothing.
  it.each(many)(
    "20,000 $name",
    { timeout: 120_000 },
    ({ make, satteriDiffers, remarkSize = 20_000 }) => {
      const input = make(20_000);
      const { costs, failed } = ownCost(input, [MDIT, SAT]);
      expect(failed).toBe(0);
      const source = make(remarkSize);
      const tree = parser.parse(source);
      const remark = timed(() =>
        unified().use(remarkAttrs).runSync(tree, source)
      );
      expect(Math.max(...costs, remark)).toBeLessThan(HOSTILE_TIME_LIMIT);
      const [mdit, remd, sat] = html(make(500));
      expect(remd).toBe(mdit);
      if (!satteriDiffers) expect(sat).toBe(mdit);
    }
  );

  // A test that only passes on a fast machine is no test: a cost per block that grows with the document doubles twice when the document doubles.
  it.each(many)(
    "twice as many $name take markdown-it about twice as long",
    { timeout: 120_000 },
    ({ make }) => {
      const small = make(10_000);
      const large = make(20_000);
      const render = withPlugin[MDIT];
      expect(
        fastest(() => render(large)) / fastest(() => render(small))
      ).toBeLessThan(3);
    }
  );

  // The same for remark, counted rather than timed, for the reason above: each rule reads a node's children about once, so a few dozen reads each is linear, and a read of all of them again per block, or per node for its index, comes to their number over again.
  it.each(many)(
    "remark's plugin reads each node's children a few times over, not once per block: $name",
    { timeout: 60_000 },
    ({ make }) => {
      const input = make(2000);
      const tree = parser.parse(input);
      const counts: { length: number; reads: number }[] = [];
      const count = (node: Node): void => {
        const parent = node as Partial<Parent>;
        if (!parent.children) return;
        for (const child of parent.children) count(child);
        if (parent.children.length < 100) return;
        const counted = { length: parent.children.length, reads: 0 };
        counts.push(counted);
        parent.children = new Proxy(parent.children, {
          get(target, key, receiver) {
            if (typeof key === "string" && /^\d+$/.test(key)) counted.reads++;
            return Reflect.get(target, key, receiver);
          }
        });
      };
      count(tree);
      unified().use(remarkAttrs).runSync(tree, input);
      expect(counts.length).toBeGreaterThan(0);
      for (const { length, reads } of counts)
        expect(reads).toBeLessThan(50 * length);
    }
  );
});

// hast-util-to-html looks each attribute's name up in property-information's table of HTML names after lower-casing it, and that table is a plain object: `constructor` and `__proto__` are found there as members every object inherits, resolve to nothing, and the serializer throws for the whole page. So remd-attrs leaves such a name out, wherever the block is, and applies the rest of the block; markdown-it and Sätteri print it. The fault is a dependency's, so this is an engine difference, kept out of the shared fixtures.
describe("attrs: a name every object inherits", () => {
  const [mdit, remd, sat] = withPlugin.map(
    (render) => (input: string) => normalizeHtml(render(input))
  );

  it.each([
    [
      "ending a paragraph, with the rest of the block",
      "text {.a constructor=own #b}",
      '<p class="a" constructor="own" id="b">text</p>',
      '<p class="a" id="b">text</p>'
    ],
    [
      "alone in a block, which is still read",
      "text {constructor=own}",
      '<p constructor="own">text</p>',
      "<p>text</p>"
    ],
    [
      "on a line of its own",
      "text\n{constructor=own}",
      '<p constructor="own">text</p>',
      "<p>text</p>"
    ],
    [
      "ending a heading",
      "# Heading {constructor=own}",
      '<h1 constructor="own">Heading</h1>',
      "<h1>Heading</h1>"
    ],
    [
      "ending a list item",
      "- item {constructor=own}",
      '<ul><li constructor="own">item</li></ul>',
      "<ul><li>item</li></ul>"
    ],
    [
      "after a list",
      "- a\n- b\n\n{constructor=own}",
      '<ul constructor="own"><li>a</li><li>b</li></ul>',
      "<ul><li>a</li><li>b</li></ul>"
    ],
    [
      "in a fence's info string",
      "```js {constructor=own}\ncode\n```",
      '<pre><code class="language-js" constructor="own">code\n</code></pre>',
      '<pre><code class="language-js">code\n</code></pre>'
    ],
    [
      "ending a table cell",
      "| A |\n|---|\n| a {constructor=own} |",
      '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td constructor="own">a</td></tr></tbody></table>',
      "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>a</td></tr></tbody></table>"
    ],
    [
      "after a table",
      "| A |\n|---|\n| a |\n\n{constructor=own}",
      '<table constructor="own"><thead><tr><th>A</th></tr></thead><tbody><tr><td>a</td></tr></tbody></table>',
      "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>a</td></tr></tbody></table>"
    ],
    [
      "after a rule",
      "---\n\n{constructor=own}",
      '<hr constructor="own">',
      "<hr>"
    ],
    [
      "after emphasis",
      "*em*{constructor=x}",
      '<p><em constructor="x">em</em></p>',
      "<p><em>em</em></p>"
    ],
    [
      "after an image",
      "![a](pic.png){constructor=own}",
      '<p><img src="pic.png" alt="a" constructor="own"></p>',
      '<p><img src="pic.png" alt="a"></p>'
    ],
    [
      "written in capitals, which the lookup lower-cases",
      "text {Constructor=x}",
      '<p Constructor="x">text</p>',
      "<p>text</p>"
    ],
    [
      "written in capitals throughout",
      "text {CONSTRUCTOR=x}",
      '<p CONSTRUCTOR="x">text</p>',
      "<p>text</p>"
    ],
    // `text {__proto__=p}` never reaches the plugin: markdown-it and remark have read the underscores as strong emphasis by then (Sätteri reads the block while it parses). An info string is not parsed for emphasis, so a fence is the way in.
    [
      "`__proto__`, in a fence's info string",
      "```js {__proto__=p}\ncode\n```",
      '<pre><code class="language-js" __proto__="p">code\n</code></pre>',
      '<pre><code class="language-js">code\n</code></pre>'
    ]
  ])("%s", (_where, input, printed, left) => {
    expect(mdit(input)).toBe(printed);
    expect(sat(input)).toBe(printed);
    expect(remd(input)).toBe(left);
  });

  // A name with a capital lower-cases to something no object has, and the lookup finds nothing: these are printed everywhere.
  it("prints names of inherited members that have a capital", () => {
    const input = "text {toString=a valueOf=b hasOwnProperty=c}";
    const printed = '<p toString="a" valueOf="b" hasOwnProperty="c">text</p>';
    expect(mdit(input)).toBe(printed);
    expect(remd(input)).toBe(printed);
    expect(sat(input)).toBe(printed);
  });

  // `allowed` lets a name through to the plugin; it can't make the serializer print it.
  it("leaves the name out in remark when `allowed` names it", () => {
    const allowed = ["class", "constructor"];
    const input = "text {.a constructor=own}";
    expect(
      normalizeHtml(new MarkdownIt().use(attrs, { allowed }).render(input))
    ).toBe('<p class="a" constructor="own">text</p>');
    expect(
      normalizeHtml(
        String(
          unified()
            .use(remarkParse)
            .use(remarkAttrs, { allowed })
            .use(remarkRehype)
            .use(rehypeStringify)
            .processSync(input)
        )
      )
    ).toBe('<p class="a">text</p>');
  });
});
