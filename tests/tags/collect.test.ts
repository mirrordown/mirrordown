import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { createTagCollector, tagAncestors } from "../../packages/core/src";
import { abbr } from "../../packages/mdit-abbr/src";
import { mark } from "../../packages/mdit-mark/src";
import { tabs } from "../../packages/mdit-tabs/src";
import { tags } from "../../packages/mdit-tags/src";
import { remarkAbbr } from "../../packages/remd-abbr/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { remarkTabs } from "../../packages/remd-tabs/src";
import { remarkTags } from "../../packages/remd-tags/src";
import { satteriAbbr } from "../../packages/sat-abbr/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { satteriTabs } from "../../packages/sat-tabs/src";
import { satteriTags } from "../../packages/sat-tags/src";

// A site's tag pages and tag lists read a document's tags from where its engine keeps per-document data: `env.tags` in markdown-it, `file.data.tags` in remark, `ctx.data.tags` in Sätteri (the result's `data.tags`). Each renderer here returns that list. GFM is on, for tables: markdown-it has them by default.

type List = (input: string) => unknown;

const mdit = (md: MarkdownIt): List => {
  return (input) => {
    const env: Record<string, unknown> = {};
    md.render(input, env);
    return env.tags;
  };
};

const remark = (plugins: PluggableList): List => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(plugins)
    .use(remarkRehype)
    .use(rehypeStringify);
  return (input) => processor.processSync(input).data.tags;
};

// The plugins' own types, so `markdownToHtml` is known to return its result directly.
type SatteriPlugin =
  | ReturnType<typeof satteriAbbr>
  | ReturnType<typeof satteriMark>
  | ReturnType<typeof satteriTabs>
  | ReturnType<typeof satteriTags>;

const satteri =
  (mdastPlugins: readonly SatteriPlugin[]): List =>
  (input) =>
    markdownToHtml(input, {
      features: { gfm: true, frontmatter: false, smartPunctuation: false },
      mdastPlugins
    }).data.tags;

const engines = [
  [`markdown-it`, mdit(new MarkdownIt().use(tags))],
  [`remark`, remark([remarkTags])],
  [`sätteri`, satteri([satteriTags()])]
] as const;

describe("tags: a document's list of tags", () => {
  const cases: [name: string, input: string, expected: string[]][] = [
    // remark reads a paragraph's own text before the emphasis inside it, and Sätteri makes `c` before `b`: the list must not follow either.
    [`in document order, around an element`, `#a *#b* #c`, [`a`, `b`, `c`]],
    [
      `in document order, through nested emphasis and two paragraphs`,
      `#a *x **#b** #c* #d\n\n#e ***#f*** #g`,
      [`a`, `b`, `c`, `d`, `e`, `f`, `g`]
    ],
    // Obsidian compares tags ignoring case and shows the casing first written; the first in the document is inside emphasis, which the plugins reach last.
    [`one entry per tag, cased as first written`, `*#Tag* #TAG #tag`, [`Tag`]],
    [
      `the first casing even when written later in the tree`,
      `#TAG *#Tag*`,
      [`TAG`]
    ],
    [
      `in a heading, a list item, a table cell and a blockquote`,
      `# #heading\n\n- #item\n\n| #head |\n| --- |\n| #cell |\n\n> #quote`,
      [`heading`, `item`, `head`, `cell`, `quote`]
    ],
    // Only what renders as a tag is listed.
    [
      `not in code or in a link's text`,
      "`#code` [#link](url) #real\n\n```\n#fenced\n```",
      [`real`]
    ],
    [`not when the hash is escaped or a reference`, `\\#x &#35;y #z`, [`z`]],
    [`empty for a document without tags`, `No tags here.`, []],
    [`empty for an empty document`, ``, []],
    // Tag names are the document's text: an object keyed by them would find these on every object. (`#__proto__` is `#` and strong emphasis in every engine; the collector's own test covers that name.)
    [
      `names that are members of every object`,
      `#constructor #toString #hasOwnProperty #valueOf #CONSTRUCTOR`,
      [`constructor`, `toString`, `hasOwnProperty`, `valueOf`]
    ],
    [
      `across Windows line endings`,
      `#one\r\n#two\r\n\r\n> #three\r\n`,
      [`one`, `two`, `three`]
    ]
  ];

  describe.each(engines)("%s", (_engine, list) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(list(input)).toEqual(expected);
    });

    // The list is set afresh for every document: a site renders many with one processor.
    it("holds only the current document's tags", () => {
      list(`#first #shared`);
      expect(list(`#Shared #second`)).toEqual([`Shared`, `second`]);
    });
  });

  // A span plugin listed before the tags plugin rebuilds a paragraph's text nodes without source positions, as the presets list them. The order comes from the walk, not from positions.
  describe("after a span plugin", () => {
    const withMark = [
      [`markdown-it`, mdit(new MarkdownIt().use(mark).use(tags))],
      [`remark`, remark([remarkMark, remarkTags])],
      [`sätteri`, satteri([satteriMark(), satteriTags()])]
    ] as const;

    it.each(withMark)("%s: keeps document order", (_engine, list) => {
      expect(list(`#x ==#Tag== #b *#c* #d #TAG`)).toEqual([
        `x`,
        `Tag`,
        `b`,
        `c`,
        `d`
      ]);
    });
  });

  // markdown-it's `parse` takes no default `env`; without one there is nowhere to keep the list, and the tags still render.
  it("markdown-it: parse without an env still reads tags", () => {
    const tokens = new MarkdownIt().use(tags).parse(`#a`, undefined);
    expect(tokens[1]?.children?.[0]?.attrGet(`href`)).toBe(`#a`);
  });
});

// The list follows the tree each engine's plugins have built by the time the tags plugin runs, so where another plugin moves content or later takes it away, the engines' lists differ, though the links they render are the same. The guide says so.
describe("tags: the list next to other plugins (engines differ)", () => {
  // markdown-it's and Sätteri's tabs plugins put every label before the panels, as the HTML does; remark keeps each label beside its panel until remark-rehype renders them.
  it.each([
    [
      `markdown-it`,
      mdit(new MarkdownIt().use(tabs).use(tags)),
      [`l1`, `l2`, `b1`, `b2`]
    ],
    [`remark`, remark([remarkTabs, remarkTags]), [`l1`, `b1`, `l2`, `b2`]],
    [
      `sätteri`,
      satteri([satteriTabs(), satteriTags()]),
      [`l1`, `l2`, `b1`, `b2`]
    ]
  ] as const)("tab labels, %s", (_engine, list, expected) => {
    expect(list(`% #l1\n> #b1\n% #l2\n> #b2`)).toEqual(expected);
  });

  // markdown-it reads an abbreviation's definition before any inline rule; remark and Sätteri read it as a paragraph until the abbr plugin, listed after the tags plugin as the presets list it, takes the paragraph away. The definition's title is the same text in all three.
  it.each([
    [`markdown-it`, mdit(new MarkdownIt().use(abbr).use(tags)), [`y`]],
    [`remark`, remark([remarkTags, remarkAbbr]), [`x`, `y`]],
    [`sätteri`, satteri([satteriTags(), satteriAbbr()]), [`x`, `y`]]
  ] as const)(
    "a tag in an abbreviation's definition, %s",
    (_engine, list, expected) => {
      expect(list(`*[HTML]: Hyper #x\n\n#y`)).toEqual(expected);
    }
  );
});

describe("tagAncestors", () => {
  // Obsidian counts a note tagged `#inbox/to-read` under `inbox` too, so a site lists it on both pages.
  it.each([
    [`inbox`, [`inbox`]],
    [`inbox/to-read`, [`inbox`, `inbox/to-read`]],
    [`a/b/c`, [`a`, `a/b`, `a/b/c`]],
    [`a//b`, [`a`, `a//b`]],
    [`a/`, [`a`, `a/`]],
    [`/a`, [`/a`]]
  ])("%s", (name, expected) => {
    expect(tagAncestors(name)).toEqual(expected);
  });
});

describe("createTagCollector", () => {
  it("lists each tag once, in the order given, with the casing first given", () => {
    const { tags: list, add } = createTagCollector();
    const before = list;
    for (const name of [`Tag`, `x`, `TAG`, `tag`, `y`]) add(name);
    expect(list).toEqual([`Tag`, `x`, `y`]);
    expect(list).toBe(before);
  });

  // The names are the document's text, and these are members of every object.
  it("collects names that are members of every object", () => {
    const { tags: list, add } = createTagCollector();
    const names = [`constructor`, `__proto__`, `toString`, `hasOwnProperty`];
    names.forEach((name) => add(name));
    expect(list).toEqual(names);
  });

  // Astro's frontmatter object comes back with the render: its `tags` become the note's tags as Obsidian counts them, the listed ones first.
  describe("given a frontmatter", () => {
    it("lists the frontmatter's tags, then the document's that are not among them", () => {
      const frontmatter = { title: `Note`, tags: [`#Inbox`, `work`] };
      const { tags: list, add } = createTagCollector(frontmatter);
      for (const name of [`inbox`, `early`, `later`]) add(name);
      expect(frontmatter.tags).toEqual([`Inbox`, `work`, `early`, `later`]);
      expect(list).toEqual([`inbox`, `early`, `later`]);
    });

    it("reads a single string as one tag", () => {
      const frontmatter = { tags: `#solo` };
      createTagCollector(frontmatter).add(`more`);
      expect(frontmatter.tags).toEqual([`solo`, `more`]);
    });

    it("gives a frontmatter without tags the document's", () => {
      const frontmatter: Record<string, unknown> = { title: `Note` };
      createTagCollector(frontmatter).add(`a`);
      expect(frontmatter).toEqual({ title: `Note`, tags: [`a`] });
    });

    // A layout that shows a tag list when `frontmatter.tags` is there must not start showing an empty one on every page, and a page's own spelling of its tags is not rewritten for nothing.
    it.each([
      [`a document without tags`, {}, [], {}],
      [
        `a document whose tags the frontmatter all lists`,
        { tags: [`#Inbox`] },
        [`inbox`],
        { tags: [`#Inbox`] }
      ]
    ])(
      "leaves the frontmatter as written for %s",
      (_name, frontmatter: Record<string, unknown>, names, expected) => {
        const { add } = createTagCollector(frontmatter);
        names.forEach((name) => add(name));
        expect(frontmatter).toEqual(expected);
      }
    );

    // YAML `tags:` with nothing after it is null: the property is there and empty.
    it("reads an empty property as listing none", () => {
      const frontmatter = { tags: null };
      createTagCollector(frontmatter).add(`a`);
      expect(frontmatter.tags).toEqual([`a`]);
    });

    it.each([
      [`a number`, 3],
      [`an object`, { a: `b` }],
      [`a list with a non-string in it`, [`a`, 1]],
      [`a list of lists`, [[`a`]]]
    ])("leaves tags that are %s alone", (_name, value) => {
      const frontmatter = { tags: value };
      const { tags: list, add } = createTagCollector(frontmatter);
      add(`a`);
      expect(frontmatter.tags).toBe(value);
      expect(list).toEqual([`a`]);
    });

    it.each([
      [`a string`, `tags`],
      [`a number`, 3],
      [`null`, null],
      [`undefined`, undefined]
    ])("collects as usual when the frontmatter is %s", (_name, frontmatter) => {
      const { tags: list, add } = createTagCollector(frontmatter);
      add(`a`);
      expect(list).toEqual([`a`]);
    });
  });
});
