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

// Known differences, pinned so a change to them is noticed. markdown-it's rule reads a header line before CommonMark's paragraph rules get to it; remark and Sätteri recognize tabs in the tree those rules built. Where the two orders give different blocks, the engines differ, and the guide says how to write the input so they don't.
interface Difference {
  name: string;
  input: string;
  mdit: string;
  others: string;
}

describe.each<Difference>([
  {
    // CommonMark reads the header and its underline as a setext heading before recognition sees them.
    name: `a header underlined with = is a heading in remark and Sätteri`,
    input: `% A\n===\n> a`,
    mdit: `${group([`A`])}<p>===</p><blockquote><p>a</p></blockquote>`,
    others: `<h1>% A</h1><blockquote><p>a</p></blockquote>`
  },
  {
    name: `a header underlined with - is a heading in remark and Sätteri`,
    input: `% A\n---\n> a`,
    mdit: `${group([`A`])}<hr><blockquote><p>a</p></blockquote>`,
    others: `<h2>% A</h2><blockquote><p>a</p></blockquote>`
  }
])(`tabs: known difference: $name`, ({ input, mdit, others }) => {
  it.each(engines)(`$engine`, ({ engine, render }) => {
    expect(mask(render(input))).toBe(engine === `markdown-it` ? mdit : others);
  });
});

// Indented four columns or more, a `>` is no blockquote marker in CommonMark: the line continues the paragraph before it, or is indented code after a blank line. remark and Sätteri have parsed it that way before recognition runs, so markdown-it's rule, which read the line without its indentation and took it for the panel, reads it the same way.
check(`tabs: a > indented four columns or more is not the panel's marker`, [
  {
    name: `directly after a header it continues the header's paragraph, so it ends the tabs as text`,
    input: `% A\n    > Body.`,
    expected: `${group([`A`])}<p>> Body.</p>`
  },
  {
    name: `the paragraph it starts goes on until a block interrupts it`,
    input: `% A\n    > Body.\nmore\n% B\n> b`,
    expected: `${group([`A`])}<p>> Body.\nmore</p>${group([`B`, `<p>b</p>`])}`
  },
  {
    name: `after a panel line it continues the panel's paragraph as text`,
    input: `% A\n> a\n    > b\n> c`,
    expected: group([`A`, `<p>a\n> b\nc</p>`])
  },
  {
    name: `after a panel's list item it continues the item's paragraph`,
    input: `% A\n> - a\n    > b`,
    expected: group([`A`, `<ul><li>a\n> b</li></ul>`])
  },
  {
    name: `after a panel's blank line it is indented code after the tabs`,
    input: `% A\n> a\n>\n    > b`,
    expected: `${group([`A`, `<p>a</p>`])}<pre><code>> b\n</code></pre>`
  },
  {
    name: `in a list item the four columns count from the item's content`,
    input: `- % A\n      > body\n\n  more`,
    expected: `<ul><li>${group([`A`])}<p>> body</p><p>more</p></li></ul>`
  },
  {
    name: `a header indented that far after a blank line is indented code`,
    input: `> % A\n> > a\n>\n>     % B`,
    expected: `<blockquote>${group([`A`, `<p>a</p>`])}<pre><code>% B\n</code></pre></blockquote>`
  }
]);

// Inside another block a blank line doesn't end a group, so a header after one continues it. But a line that is neither a header nor a `>` line has ended the group before the blank line, as it does in markdown-it: the header after it starts a new group. remark and Sätteri left that line in the panel until a later pass and joined the header's tab to the group it had ended.
check(
  `tabs: in a nested block, a group an unmarked line ended is not continued after a blank line`,
  [
    {
      name: `in a list item`,
      input: `- % A\n  > a\n  text\n\n  % B\n  > b`,
      expected: `<ul><li>${group([`A`, `<p>a</p>`])}<p>text</p>${group([`B`, `<p>b</p>`])}</li></ul>`
    },
    {
      name: `in a blockquote`,
      input: `> % A\n> > a\n> text\n>\n> % B\n> > b`,
      expected: `<blockquote>${group([`A`, `<p>a</p>`])}<p>text</p>${group([`B`, `<p>b</p>`])}</blockquote>`
    },
    {
      name: `when the line continues a paragraph nested in the panel`,
      input: `- % A\n  > - x\n  text\n\n  % B\n  > b`,
      expected: `<ul><li>${group([`A`, `<ul><li>x</li></ul>`])}<p>text</p>${group([`B`, `<p>b</p>`])}</li></ul>`
    },
    {
      name: `after the group's second tab`,
      input: `- % A\n  > a\n  % B\n  > b\n  text\n\n  % C\n  > c`,
      expected: `<ul><li>${group([`A`, `<p>a</p>`], [`B`, `<p>b</p>`])}<p>text</p>${group([`C`, `<p>c</p>`])}</li></ul>`
    },
    {
      name: `without such a line, the header after the blank line is the group's next tab`,
      input: `- % A\n  > a\n\n  % B\n  > b`,
      expected: `<ul><li>${group([`A`, `<p>a</p>`], [`B`, `<p>b</p>`])}</li></ul>`
    }
  ]
);

// A header interrupts the paragraph before it, as markdown-it's block rule does. In a list item, remark and Sätteri left every header after text alone, because CommonMark may have lazily continued it from outside the item; the column the item's content starts at tells the two apart, so a header written in the item starts tabs in every engine.
check(
  `tabs: a header after text in a list item starts tabs when it is written in the item`,
  [
    {
      name: `at the item's content column`,
      input: `- text\n  % A\n  > a`,
      expected: `<ul><li>text\n${group([`A`, `<p>a</p>`])}</li></ul>`
    },
    {
      name: `in an ordered item, whose content starts further in`,
      input: `1. text\n   % A\n   > a\n   % B\n   > b`,
      expected: `<ol><li>text\n${group([`A`, `<p>a</p>`], [`B`, `<p>b</p>`])}</li></ol>`
    },
    {
      name: `after a line that ended the item's earlier tabs`,
      input: `- % A\n  > a\n  text\n  % B`,
      expected: `<ul><li>${group([`A`, `<p>a</p>`])}\ntext\n${group([`B`])}</li></ul>`
    }
  ]
);

// A header indented four columns or more past the paragraph before it continues that paragraph, in CommonMark and in markdown-it, whose block rules don't run on such a line. remark and Sätteri started tabs there.
check(
  `tabs: a header indented four columns or more after text continues the paragraph`,
  [
    {
      name: `at the top level`,
      input: `text\n    % A`,
      expected: `<p>text\n% A</p>`
    },
    {
      name: `in a blockquote`,
      input: `> text\n>     % A`,
      expected: `<blockquote><p>text\n% A</p></blockquote>`
    }
  ]
);

// A line written short of a list item's content, with nothing that interrupts a paragraph on it, continues the paragraph before it in CommonMark, so remark and Sätteri find it inside the item and cannot move it out. markdown-it's rule ended the item at such a line (a header there even started tabs after the list); it now reads the line as the others do: it ends the tabs and stays in the item, and a header written there is text.
check(`tabs: a line written short of a list item's content stays in the item`, [
  {
    name: `a header after the item's text is text`,
    input: `- item\n% A`,
    expected: `<ul><li>item\n% A</li></ul>`
  },
  {
    name: `a plain line after a panel ends the tabs and follows them in the item`,
    input: `- % A\n  > a\npara`,
    expected: `<ul><li>${group([`A`, `<p>a</p>`])}\npara</li></ul>`
  },
  {
    name: `with no paragraph to continue (the panel ends in a fence), the line ends the item`,
    input: "- % A\n  > ```\n  > code\n  > ```\npara",
    expected: `<ul><li>${group([`A`, `<pre><code>code\n</code></pre>`])}</li></ul><p>para</p>`
  },
  {
    name: `a block that interrupts a paragraph ends the item`,
    input: `- % A\n  > a\n# H`,
    expected: `<ul><li>${group([`A`, `<p>a</p>`])}</li></ul><h1>H</h1>`
  }
]);

// Known difference, pinned so a change to it is noticed. A line without any `>` leaves the blockquote the tabs are in. Where it ends the group's last panel, remark and Sätteri split the blockquote there as markdown-it does; where a header follows it, they keep the line and the tabs after it in the blockquote.
describe(`tabs: a line that leaves the blockquote between two tabs (known difference)`, () => {
  const input = `> % A\n> > a\ntext\n> % B`;
  it.each(engines)(`$engine`, ({ engine, render }) => {
    expect(mask(render(input))).toBe(
      engine === `markdown-it`
        ? `<blockquote>${group([`A`, `<p>a</p>`])}</blockquote><p>text</p><blockquote>${group([`B`])}</blockquote>`
        : `<blockquote>${group([`A`, `<p>a</p>`])}<p>text</p>${group([`B`])}</blockquote>`
    );
  });
});

check(`tabs: a header after text in a list item, after a blank line`, [
  {
    name: `starts tabs in every engine`,
    input: `- text\n\n  % A\n  > a`,
    expected: `<ul><li><p>text</p>${group([`A`, `<p>a</p>`])}</li></ul>`
  }
]);

// A backslash is the only way to write a line that starts with `% ` and isn't a tab. remark and Sätteri read text after escapes and character references are resolved, so they saw a header where markdown-it, reading the line itself, sees none.
check(`tabs: an escaped header is text`, [
  {
    name: `an escaped % starts no tabs`,
    input: `\\% A\n> b`,
    expected: `<p>% A</p><blockquote><p>b</p></blockquote>`
  },
  {
    name: `an escaped % after a header ends the tabs`,
    input: `% A\n\\% B`,
    expected: `${group([`A`])}<p>% B</p>`
  },
  {
    name: `an escaped % in a body starts no tabs there`,
    input: `% A\n> \\% not`,
    expected: group([`A`, `<p>% not</p>`])
  },
  {
    name: `an escaped % after a body, written without its marker, ends the tabs`,
    input: `% A\n> x\n\\% B`,
    expected: `${group([`A`, `<p>x</p>`])}<p>% B</p>`
  },
  {
    name: `an escaped % after text does not interrupt it`,
    input: `text\n\\% A`,
    expected: `<p>text\n% A</p>`
  },
  {
    name: `a character reference for % starts no tabs`,
    input: `&#37; A`,
    expected: `<p>% A</p>`
  },
  {
    name: `an escaped plus makes no header`,
    input: `%\\+ A`,
    expected: `<p>%+ A</p>`
  }
]);
