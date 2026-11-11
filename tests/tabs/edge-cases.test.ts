// Malformed and edge-case input, where markdown-it's line scanner and the tree recognition remark and Sätteri share used to disagree. Each case is written as a string, because the fixture file can't hold a carriage return, a tab or trailing spaces; every engine must render exactly the expected HTML. Ids are masked here (`tabs-X`, group `G`): these cases are about structure, and `ids.test.ts` covers the ids.
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { tabs } from "../../packages/mdit-tabs/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { satteriTabs } from "../../packages/sat-tabs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(tabs);
const remark = unified()
  .use(remarkParse)
  .use(remarkTabs)
  .use(remarkRehype, { handlers: tabsHastHandlers as never })
  .use(rehypeStringify, { allowDangerousHtml: true });

const engines = [
  { engine: `markdown-it`, render: (input: string) => md.render(input) },
  {
    engine: `remark`,
    render: (input: string) => String(remark.processSync(input))
  },
  {
    engine: `sätteri`,
    render: (input: string) =>
      markdownToHtml(input, {
        features: { gfm: false, frontmatter: false, smartPunctuation: false },
        mdastPlugins: [satteriTabs()]
      }).html
  }
];

const mask = (html: string): string =>
  normalizeHtml(html)
    .replace(/data-tabs-group="[0-9a-f]+"/g, `data-tabs-group="G"`)
    .replace(/tabs-[0-9a-f]+(?=[-"])/g, `tabs-X`);

/** One tab: its label as rendered, its panel's HTML, and its `aria-label` where that differs from the label. */
type Tab = [label: string, body?: string, aria?: string];

// A tab group as every engine renders it, so the expected HTML reads as its structure. The first tab is the open one.
const group = (...items: Tab[]): string => {
  const labels = items
    .map(
      ([label], index) =>
        `<input type="radio" name="tabs-X" id="tabs-X-${index}" hidden${index === 0 ? ` checked` : ``}><label class="markdown-tabs-label" for="tabs-X-${index}">${label}</label>`
    )
    .join(``);
  const panels = items
    .map(
      ([label, body = ``, aria = label]) =>
        `<section class="markdown-tabs-panel" aria-label="${aria}">${body}</section>`
    )
    .join(``);
  return `<div class="markdown-tabs" data-tabs-group="G"><div class="markdown-tabs-labels">${labels}</div><div class="markdown-tabs-panels">${panels}</div></div>`;
};

interface Case {
  name: string;
  input: string;
  expected: string;
}

const check = (title: string, cases: Case[]): void => {
  describe.each(cases)(`${title}: $name`, ({ input, expected }) => {
    it.each(engines)(`$engine`, ({ render }) => {
      expect(mask(render(input))).toBe(expected);
    });
  });
};

check(`tabs: a carriage return ends a line, and never reaches the output`, [
  {
    name: `CRLF between a body and the next header leaves none in the panel`,
    input: `% One\r\n> First.\r\n% Two\r\n> Second.\r\n`,
    expected: group([`One`, `<p>First.</p>`], [`Two`, `<p>Second.</p>`])
  },
  {
    name: `CRLF between headers leaves none in a label`,
    input: `% A\r\n% B\r\n% C`,
    expected: group([`A`], [`B`], [`C`])
  },
  {
    name: `a lone carriage return separates tabs as a line feed does`,
    input: `% A\r> a\r% B\r> b`,
    expected: group([`A`, `<p>a</p>`], [`B`, `<p>b</p>`])
  },
  {
    name: `a header written with the panel's marker, after lone carriage returns, is the panel's content`,
    input: `% A
> text
> % Inner`,
    expected: group([`A`, `<p>text</p>${group([`Inner`])}`])
  }
]);

// A line's `>` markers are read from the source line it's written on. Counting lines from the paragraph's first one goes wrong after inline content that spans lines, and the next tab's header was then taken for panel text in remark and Sätteri.
check(
  `tabs: a line is placed by its own source line, after inline content that spans lines`,
  [
    {
      name: `a header after emphasis spanning two body lines starts the next tab`,
      input: `% A\n> *emph\n> more* text\n% B\n> b`,
      expected: group(
        [`A`, `<p><em>emph\nmore</em> text</p>`],
        [`B`, `<p>b</p>`]
      )
    }
  ]
);

// A `%%` tab is nested in the tab before it, but its body is written with that tab's single `>`. Counting it as one level deeper made every body line after the first look as if it had left the panel.
check(`tabs: a nested tab's body keeps every line written with one >`, [
  {
    name: `two body lines under a %% header stay in its panel`,
    input: `% A\n%% B\n> one\n> two`,
    expected: group([`A`, group([`B`, `<p>one\ntwo</p>`])])
  }
]);

// A header is one line, so nothing can break after it: spaces at its end are trailing spaces, in the label and for whether the line is a header at all, and a backslash there is a literal one.
check(`tabs: a header line ends at its last character`, [
  {
    name: `a marker followed only by a space is not a header`,
    input: `% \n> Body.`,
    expected: `<p>%</p><blockquote><p>Body.</p></blockquote>`
  },
  {
    name: `one trailing space is not part of the label`,
    input: `% A \n% B\n> Body.`,
    expected: group([`A`], [`B`, `<p>Body.</p>`])
  },
  {
    name: `two trailing spaces make no line break`,
    input: `% A  \n% B\n> Body.`,
    expected: group([`A`], [`B`, `<p>Body.</p>`])
  },
  {
    name: `a trailing backslash is a literal backslash`,
    input: `% A\\\n% B\n> Body.`,
    expected: group([`A\\`], [`B`, `<p>Body.</p>`])
  },
  {
    name: `two trailing spaces on a header that follows a body make no line break`,
    input: `% A\n> a\n% B  \n> b`,
    expected: group([`A`, `<p>a</p>`], [`B`, `<p>b</p>`])
  },
  {
    name: `a hard break ending the body line before a header is dropped`,
    input: `% A\n> a  \n% B\n> b`,
    expected: group([`A`, `<p>a</p>`], [`B`, `<p>b</p>`])
  }
]);

// markdown-it's rule never compared a line's indentation with the block it runs in, so in a list item it kept reading lines written outside the item. CommonMark has closed the item by then, which is what remark and Sätteri render.
check(`tabs: a group in a list item ends where the item ends`, [
  {
    name: `a > line written outside the item is a blockquote after the list`,
    input: `- % One\n> First.`,
    expected: `<ul><li>${group([`One`])}</li></ul><blockquote><p>First.</p></blockquote>`
  },
  {
    name: `a header outside the item right after a body line continues the group, but its > line doesn't`,
    input: `- % One\n  > First.\n% Two\n> Second.`,
    expected: `<ul><li>${group([`One`, `<p>First.</p>`], [`Two`])}</li></ul><blockquote><p>Second.</p></blockquote>`
  },
  {
    name: `a header outside the item after a blank line starts a group of its own`,
    input: `- % One\n  > a\n\n% Two\n> b`,
    expected: `<ul><li>${group([`One`, `<p>a</p>`])}</li></ul>${group([`Two`, `<p>b</p>`])}`
  },
  {
    name: `a > line outside the item after a blank line is a blockquote`,
    input: `- % One\n  > a\n\n> b`,
    expected: `<ul><li>${group([`One`, `<p>a</p>`])}</li></ul><blockquote><p>b</p></blockquote>`
  }
]);

// markdown-it tokenizes a panel's body from its lines with the `>` taken off, and has to read them as CommonMark reads a blockquote's content, which is what the other engines get.
check(`tabs: a panel's body is read as a blockquote's content`, [
  {
    name: `a fence the end of the panel closes keeps its last line's line ending`,
    input: "% A\n> ```\n> code\n% B\n> b",
    expected: group([`A`, `<pre><code>code\n</code></pre>`], [`B`, `<p>b</p>`])
  },
  {
    name: `a tab after the marker is the marker's space, not indentation for code`,
    input: `% A\n>\ttext`,
    expected: group([`A`, `<p>text</p>`])
  },
  {
    name: `a blank line without the panel's marker ends the list before it`,
    input: `> % A\n> > - a\n>\n> > - b`,
    expected: `<blockquote>${group([`A`, `<ul><li>a</li></ul><ul><li>b</li></ul>`])}</blockquote>`
  },
  {
    name: `a blank line without the panel's marker ends the fence before it`,
    input: "- % A\n  > ```\n  > code\n\n  > more\n  > ```",
    expected: `<ul><li>${group([`A`, `<pre><code>code\n</code></pre><p>more</p><pre><code></code></pre>`])}</li></ul>`
  },
  {
    name: `a blank line written with the panel's marker keeps a loose list together`,
    input: `% A\n> - a\n>\n> - b`,
    expected: group([`A`, `<ul><li><p>a</p></li><li><p>b</p></li></ul>`])
  }
]);

// markdown-it ends a group at any line that is neither a header nor a `>` line. CommonMark instead continues the paragraph before it with such a line, so remark and Sätteri found it inside a header's paragraph (no tabs at all) or inside a panel (as the panel's text, or the next tab's). Recognition now ends the group there too.
check(`tabs: a line that is neither a header nor a > line ends the group`, [
  {
    name: `right after the header`,
    input: `% A\ntext`,
    expected: `${group([`A`])}<p>text</p>`
  },
  {
    name: `after several headers, with a new group after it`,
    input: `% A\n% B\ntext\n% C`,
    expected: `${group([`A`], [`B`])}<p>text</p>${group([`C`])}`
  },
  {
    name: `after a body, with a header after it that starts a new group`,
    input: `% A\n> a\ntext\n% B\n> b`,
    expected: `${group([`A`, `<p>a</p>`])}<p>text</p>${group([`B`, `<p>b</p>`])}`
  },
  {
    name: `right after a header that follows a body`,
    input: `% One\n> a\n% Two\ntext`,
    expected: `${group([`One`, `<p>a</p>`], [`Two`])}<p>text</p>`
  },
  {
    name: `right after a header that follows a list in a body`,
    input: `% A\n> - item\n% B\nplain`,
    expected: `${group([`A`, `<ul><li>item</li></ul>`], [`B`])}<p>plain</p>`
  },
  {
    name: `after a body, with a > line after it that is then a blockquote`,
    input: `% One\n> First\nAfter\n> quoted`,
    expected: `${group([`One`, `<p>First</p>`])}<p>After</p><blockquote><p>quoted</p></blockquote>`
  },
  {
    name: `in a paragraph that isn't the panel's last`,
    input: `% A\n> a\ntext\n>\n> more\n% B`,
    expected: `${group([`A`, `<p>a</p>`])}<p>text</p><blockquote><p>more\n% B</p></blockquote>`
  },
  {
    name: `in a blockquote, a line with the blockquote's marker but not the panel's`,
    input: `> % One\n> > First.\n% Two\n> Second.`,
    expected: `<blockquote>${group([`One`, `<p>First.</p>`], [`Two`])}<p>Second.</p></blockquote>`
  },
  {
    name: `in a list item, where the line stays in the item`,
    input: `- % A\n  text`,
    expected: `<ul><li>${group([`A`])}\ntext</li></ul>`
  }
]);
