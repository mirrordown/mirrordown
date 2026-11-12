// Malformed and edge-case input, where markdown-it's line scanner and the tree recognition remark and Sätteri share used to disagree. Each case is written as a string, because the fixture file can't hold a carriage return, a tab or trailing spaces; every engine must render exactly the expected HTML.
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { steps } from "../../packages/mdit-steps/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import { satteriSteps } from "../../packages/sat-steps/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(steps);
const remark = unified()
  .use(remarkParse)
  .use(remarkSteps)
  .use(remarkRehype, { handlers: stepsHastHandlers as never })
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
        mdastPlugins: [satteriSteps()]
      }).html
  }
];

// The elements every case is made of, so the expected HTML reads as its structure.
const OL = `<ol class="markdown-steps">`;
const SUB = `<ol class="markdown-steps-list">`;
const LI = (step: number): string =>
  `<li class="markdown-steps-item" data-step="${step}">`;
const T = `<p class="markdown-steps-title">`;
const B = `<div class="markdown-steps-body">`;

interface Case {
  name: string;
  input: string;
  expected: string;
}

const check = (title: string, cases: Case[]): void => {
  describe.each(cases)(`${title}: $name`, ({ input, expected }) => {
    it.each(engines)(`$engine`, ({ render }) => {
      expect(normalizeHtml(render(input))).toBe(expected);
    });
  });
};

check(`steps: a carriage return ends a line, and never reaches the output`, [
  {
    name: `CRLF between headers leaves no carriage return in a title`,
    input: `@1. A\r\n@1. B\r\n@1. C`,
    expected: `${OL}${LI(1)}${T}A</p></li>${LI(2)}${T}B</p></li>${LI(3)}${T}C</p></li></ol>`
  },
  {
    name: `CRLF between a body and the next header leaves none in either`,
    input: `@1. A\r\n> body\r\n@1. B\r\n> b2\r\n`,
    expected: `${OL}${LI(1)}${T}A</p>${B}<p>body</p></div></li>${LI(2)}${T}B</p>${B}<p>b2</p></div></li></ol>`
  },
  {
    name: `a lone carriage return separates steps as a line feed does`,
    input: `@1. A\r> body\r@1. B`,
    expected: `${OL}${LI(1)}${T}A</p>${B}<p>body</p></div></li>${LI(2)}${T}B</p></li></ol>`
  }
]);

// A line's `>` markers are read from the source line it's written on. Counting lines from the paragraph's first one goes wrong after inline content that spans lines, and the step header or the end of the group after it was then missed in remark and Sätteri.
check(
  `steps: a line is placed by its own source line, after inline content that spans lines`,
  [
    {
      name: `a header after emphasis spanning two body lines starts the next step`,
      input: `@1. A\n> *emph\n> more* text\n@1. B`,
      expected: `${OL}${LI(1)}${T}A</p>${B}<p><em>emph\nmore</em> text</p></div></li>${LI(2)}${T}B</p></li></ol>`
    },
    {
      name: `a line without the body's marker after a code span spanning two lines ends the group`,
      input: "@1. A\n> `a\n> b` text\nplain",
      expected: `${OL}${LI(1)}${T}A</p>${B}<p><code>a b</code> text</p></div></li></ol><p>plain</p>`
    }
  ]
);

// A sub-step is nested in its parent step, but its body is written with the same single `>` as its parent's. Counting one marker per nesting level made remark and Sätteri read every body line after the first as written outside the sub-step, and move it into the parent step.
check(`steps: a sub-step's body keeps all of its lines`, [
  {
    name: `a two-line paragraph stays whole in the sub-step`,
    input: `@1. A\n@@1. B\n> line one\n> line two`,
    expected: `${OL}${LI(1)}${T}A</p>${SUB}${LI(1)}${T}B</p>${B}<p>line one\nline two</p></div></li></ol></li></ol>`
  },
  {
    name: `at the third level too`,
    input: `@1. A\n@@1. B\n@@@1. C\n> one\n> two`,
    expected: `${OL}${LI(1)}${T}A</p>${SUB}${LI(1)}${T}B</p>${SUB}${LI(1)}${T}C</p>${B}<p>one\ntwo</p></div></li></ol></li></ol></li></ol>`
  },
  {
    name: `in the last of several sub-steps`,
    input: `@1. A\n@@1. B\n> b1\n> b2\n@@1. C\n> c1\n> c2`,
    expected: `${OL}${LI(1)}${T}A</p>${SUB}${LI(1)}${T}B</p>${B}<p>b1\nb2</p></div></li>${LI(2)}${T}C</p>${B}<p>c1\nc2</p></div></li></ol></li></ol>`
  },
  {
    name: `inside a blockquote, where every line carries one more marker`,
    input: `> @1. A\n> @@1. B\n> > one\n> > two`,
    expected: `<blockquote>${OL}${LI(1)}${T}A</p>${SUB}${LI(1)}${T}B</p>${B}<p>one\ntwo</p></div></li></ol></li></ol></blockquote>`
  },
  {
    name: `a header written in the sub-step's body starts a group there, not in the parent step`,
    input: `@1. A\n@@1. B\n> text\n> @1. Inner`,
    expected: `${OL}${LI(1)}${T}A</p>${SUB}${LI(1)}${T}B</p>${B}<p>text</p>${OL}${LI(1)}${T}Inner</p></li></ol></div></li></ol></li></ol>`
  }
]);

// markdown-it ends a group at the first line that is neither a header nor a `>` line, and parses what follows as ordinary markdown. CommonMark had already continued those lines into the body's last paragraph, so remark and Sätteri have to rebuild them from their markers: flattened into one paragraph, a quote after the group lost its `>`.
check(
  `steps: the lines that end a group are read as the blocks they are written as`,
  [
    {
      name: `a quote after the line that ends the group is a blockquote`,
      input: `@1. A\n> body\nplain\n> quote`,
      expected: `${OL}${LI(1)}${T}A</p>${B}<p>body</p></div></li></ol><p>plain</p><blockquote><p>quote</p></blockquote>`
    },
    {
      name: `a line that ends a group in a body ends the group around it too`,
      input: `@1. A\n> @1. Inner\n> > one\nplain\n> quote`,
      expected: `${OL}${LI(1)}${T}A</p>${B}${OL}${LI(1)}${T}Inner</p>${B}<p>one</p></div></li></ol></div></li></ol><p>plain</p><blockquote><p>quote</p></blockquote>`
    },
    {
      name: `a line with the outer body's marker ends only the group written in that body`,
      input: `@1. A\n> @1. Inner\n> > one\n> plain\n> > quote`,
      expected: `${OL}${LI(1)}${T}A</p>${B}${OL}${LI(1)}${T}Inner</p>${B}<p>one</p></div></li></ol><p>plain</p><blockquote><p>quote</p></blockquote></div></li></ol>`
    },
    {
      name: `a line that ends a sub-step's body ends the whole group, not just the sub-steps`,
      input: `@1. A\n@@1. B\n> one\nplain\nmore`,
      expected: `${OL}${LI(1)}${T}A</p>${SUB}${LI(1)}${T}B</p>${B}<p>one</p></div></li></ol></li></ol><p>plain\nmore</p>`
    },
    {
      name: `a line without any marker ends a group in a blockquote and the blockquote`,
      input: `> @1. A\n> > body\nplain`,
      expected: `<blockquote>${OL}${LI(1)}${T}A</p>${B}<p>body</p></div></li></ol></blockquote><p>plain</p>`
    }
  ]
);

// The same line ends a group wherever it is written, not only at the end of the last step's last paragraph. CommonMark continues the paragraph before it with such a line, so remark and Sätteri kept it in a step's body and went on with the group: the steps on either side of the line were numbered as one list, where markdown-it renders two.
check(
  `steps: a line that is neither a header nor a body line ends the group wherever it is written`,
  [
    {
      name: `between a body and the next header: that header starts a new list at 1`,
      input: `@1. A\n> a\ntext\n@1. B\n> b`,
      expected: `${OL}${LI(1)}${T}A</p>${B}<p>a</p></div></li></ol><p>text</p>${OL}${LI(1)}${T}B</p>${B}<p>b</p></div></li></ol>`
    },
    {
      name: `directly after a header that follows a body: it is not that step's body`,
      input: `@1. One\n> a\n@1. Two\ntext`,
      expected: `${OL}${LI(1)}${T}One</p>${B}<p>a</p></div></li>${LI(2)}${T}Two</p></li></ol><p>text</p>`
    },
    {
      name: `directly after a header that follows a list in a body`,
      input: `@1. A\n> - item\n@1. B\nplain`,
      expected: `${OL}${LI(1)}${T}A</p>${B}<ul><li>item</li></ul></div></li>${LI(2)}${T}B</p></li></ol><p>plain</p>`
    },
    {
      name: `after a list in a body, before the next header`,
      input: `@1. A\n> - item\nplain\n@1. B`,
      expected: `${OL}${LI(1)}${T}A</p>${B}<ul><li>item</li></ul></div></li></ol><p>plain</p>${OL}${LI(1)}${T}B</p></li></ol>`
    },
    {
      name: `before a block of the body: what follows is a quote after the list, not more of the body`,
      input: `@1. A\n> body\nplain\n> > deep\n> back`,
      expected: `${OL}${LI(1)}${T}A</p>${B}<p>body</p></div></li></ol><p>plain</p><blockquote><blockquote><p>deep\nback</p></blockquote></blockquote>`
    },
    {
      name: `before a blank line and a header: the header starts a new list`,
      input: `@1. A\n> a\ntext\n\n@1. B`,
      expected: `${OL}${LI(1)}${T}A</p>${B}<p>a</p></div></li></ol><p>text</p>${OL}${LI(1)}${T}B</p></li></ol>`
    },
    {
      name: `in a sub-step's body: the header after it starts a new list, not the next step`,
      input: `@1. A\n@@1. B\n> one\nplain\n@1. C`,
      expected: `${OL}${LI(1)}${T}A</p>${SUB}${LI(1)}${T}B</p>${B}<p>one</p></div></li></ol></li></ol><p>plain</p>${OL}${LI(1)}${T}C</p></li></ol>`
    },
    {
      name: `the body of the list after it is read by its markers: a header in it starts steps in that body`,
      input: `@1. A\n> a\ntext\n@1. B\n> @1. Inner\n> > in`,
      expected: `${OL}${LI(1)}${T}A</p>${B}<p>a</p></div></li></ol><p>text</p>${OL}${LI(1)}${T}B</p>${B}${OL}${LI(1)}${T}Inner</p>${B}<p>in</p></div></li></ol></div></li></ol>`
    }
  ]
);

// A header is one line, so nothing can break after it. CommonMark still reads two trailing spaces or a backslash before the next line as a hard break, which remark and Sätteri kept: a `<br>` ended the title, and the group ended at the empty line the break left behind. markdown-it reads the line itself, where trailing spaces are just that and a backslash is literal (as CommonMark reads one that ends a block).
check(`steps: a header line ends its title, whatever it ends with`, [
  {
    name: `trailing spaces are not part of the title`,
    input: `@1. Title   \n> body`,
    expected: `${OL}${LI(1)}${T}Title</p>${B}<p>body</p></div></li></ol>`
  },
  {
    name: `two trailing spaces before the next header don't break the title or end the group`,
    input: `@1. Title  \n@1. Two`,
    expected: `${OL}${LI(1)}${T}Title</p></li>${LI(2)}${T}Two</p></li></ol>`
  },
  {
    name: `a trailing backslash before the next header is a literal backslash`,
    input: `@1. Title\\\n@1. Two`,
    expected: `${OL}${LI(1)}${T}Title\\</p></li>${LI(2)}${T}Two</p></li></ol>`
  },
  {
    name: `the same for headers after a body, and after other inline content`,
    input: `@1. A\n> b\n@1. B  \n@1. C *x*\\\n> c`,
    expected: `${OL}${LI(1)}${T}A</p>${B}<p>b</p></div></li>${LI(2)}${T}B</p></li>${LI(3)}${T}C <em>x</em>\\</p>${B}<p>c</p></div></li></ol>`
  },
  {
    name: `a body line's trailing spaces before a header don't leave a break at the end of the body`,
    input: `@1. A\n> body  \n@1. B`,
    expected: `${OL}${LI(1)}${T}A</p>${B}<p>body</p></div></li>${LI(2)}${T}B</p></li></ol>`
  },
  {
    name: `a body line's trailing backslash before a header is a literal backslash`,
    input: `@1. A\n> body\\\n@1. B`,
    expected: `${OL}${LI(1)}${T}A</p>${B}<p>body\\</p></div></li>${LI(2)}${T}B</p></li></ol>`
  },
  {
    name: `a hard break between two lines of a body is still one`,
    input: `@1. A\n> line\\\n> more\n@1. B`,
    expected: `${OL}${LI(1)}${T}A</p>${B}<p>line<br>\nmore</p></div></li>${LI(2)}${T}B</p></li></ol>`
  }
]);

// CommonMark lets a tab stand in for the space after a blockquote's `>`. markdown-it's steps rule only knew the space, so the tab stayed in the body and made its line indented code.
check(`steps: a tab after the body's marker is the marker's space`, [
  {
    name: `the line is a paragraph, not indented code`,
    input: `@1. S\n>\tbody`,
    expected: `${OL}${LI(1)}${T}S</p>${B}<p>body</p></div></li></ol>`
  }
]);

// markdown-it tokenizes a step's body from its lines with the `>` taken off, joined without a line ending after the last one. A fence that the end of the body closes then lost its last line's line ending, which every line of a blockquote's content has in CommonMark, and so in the other engines.
check(`steps: a body is read as a blockquote's content`, [
  {
    name: `a fence the end of the body closes keeps its last line's line ending`,
    input: "@1. A\n> ```\n> code\n@1. B",
    expected: `${OL}${LI(1)}${T}A</p>${B}<pre><code>code\n</code></pre></div></li>${LI(2)}${T}B</p></li></ol>`
  }
]);

// The stylesheet pads a step's body, so an empty body element is visible. markdown-it took the blank lines between two headers, or a lone `>`, for body lines and rendered an empty body for them; a step without content has no body element in any engine.
check(`steps: a step without content has no body element`, [
  {
    name: `blank lines between title-only steps`,
    input: `@1. A\n\n\n@1. B`,
    expected: `${OL}${LI(1)}${T}A</p></li>${LI(2)}${T}B</p></li></ol>`
  },
  {
    name: `a lone marker`,
    input: `@1. A\n>\n@1. B`,
    expected: `${OL}${LI(1)}${T}A</p></li>${LI(2)}${T}B</p></li></ol>`
  },
  {
    name: `a blank line before a sub-step`,
    input: `@1. A\n\n@@1. B`,
    expected: `${OL}${LI(1)}${T}A</p>${SUB}${LI(1)}${T}B</p></li></ol></li></ol>`
  }
]);

// Steps in a list item end where the item ends. markdown-it's steps rule read on past it, taking a `>` line or a header written at the list's own indentation into the item's steps, where CommonMark (and so remark and Sätteri) had already closed the item.
check(`steps: steps in a list item end with the item`, [
  {
    name: `a quote written outside the item, directly under the header, is a blockquote after the list`,
    input: `- @1. Step\n> Body`,
    expected: `<ul><li>${OL}${LI(1)}${T}Step</p></li></ol></li></ul><blockquote><p>Body</p></blockquote>`
  },
  {
    name: `a quote written outside the item after a body line is one too`,
    input: `- @1. Step\n  > a\n> b`,
    expected: `<ul><li>${OL}${LI(1)}${T}Step</p>${B}<p>a</p></div></li></ol></li></ul><blockquote><p>b</p></blockquote>`
  },
  {
    name: `a header written outside the item after a blank line starts new steps`,
    input: `- @1. Step\n  > Body.\n\n@1. Outside`,
    expected: `<ul><li>${OL}${LI(1)}${T}Step</p>${B}<p>Body.</p></div></li></ol></li></ul>${OL}${LI(1)}${T}Outside</p></li></ol>`
  },
  {
    name: `a header written outside the item without a blank line still continues its steps`,
    input: `- @1. Step\n  > Body.\n@2. Two`,
    expected: `<ul><li>${OL}${LI(1)}${T}Step</p>${B}<p>Body.</p></div></li>${LI(2)}${T}Two</p></li></ol></li></ul>`
  },
  {
    name: `lines written in the item after blank lines stay in its steps`,
    input: `- @1. Step\n  > a\n\n  > b\n\n  @1. Two`,
    expected: `<ul><li>${OL}${LI(1)}${T}Step</p>${B}<p>a</p><p>b</p></div></li>${LI(2)}${T}Two</p></li></ol></li></ul>`
  }
]);

// A blank line inside a body needs the body's `>`. Written without it, CommonMark ends the blockquote there, so remark and Sätteri get two quotes and can't join what the blank line separated; markdown-it's steps rule joined the body's lines into one document, where a list or a fence carried on across the blank line. It now reads each run of lines on its own.
check(
  `steps: a blank line without the body's marker ends the blocks before it`,
  [
    {
      name: `two lists, not one loose list`,
      input: `@1. S\n> - a\n\n> - b`,
      expected: `${OL}${LI(1)}${T}S</p>${B}<ul><li>a</li></ul><ul><li>b</li></ul></div></li></ol>`
    },
    {
      name: `a fence ends at the blank line`,
      input: "@1. S\n> ```js\n> a\n\n> b\n> ```",
      expected: `${OL}${LI(1)}${T}S</p>${B}<pre><code class="language-js">a\n</code></pre><p>b</p><pre><code></code></pre></div></li></ol>`
    },
    {
      name: `a blank line written with the marker keeps a list together`,
      input: `@1. S\n> - a\n>\n> - b`,
      expected: `${OL}${LI(1)}${T}S</p>${B}<ul><li><p>a</p></li><li><p>b</p></li></ul></div></li></ol>`
    },
    {
      name: `paragraphs are the same either way`,
      input: `@1. S\n> a\n>\n> b\n\n\n> c`,
      expected: `${OL}${LI(1)}${T}S</p>${B}<p>a</p><p>b</p><p>c</p></div></li></ol>`
    }
  ]
);

// Without the alerts plugin a `[!NOTE]` line is text. Directly under a header it is the first line of the step's body in every engine (remark and Sätteri used to end the steps there); after a blank line it starts a quote of its own, so a document reads the same once the alerts plugin is added.
check(
  `steps: a quote that starts with an alert marker, without the alerts plugin`,
  [
    {
      name: `directly under the header, it is the body`,
      input: `@1. S\n> [!NOTE]\n> text`,
      expected: `${OL}${LI(1)}${T}S</p>${B}<p>[!NOTE]\ntext</p></div></li></ol>`
    },
    {
      name: `a marker with text after it is the body too`,
      input: `@1. S\n> [!NOTE] not alone\n> text`,
      expected: `${OL}${LI(1)}${T}S</p>${B}<p>[!NOTE] not alone\ntext</p></div></li></ol>`
    },
    {
      name: `nested one level deeper, it is a quote in the body`,
      input: `@1. S\n> > [!NOTE]\n> > text`,
      expected: `${OL}${LI(1)}${T}S</p>${B}<blockquote><p>[!NOTE]\ntext</p></blockquote></div></li></ol>`
    },
    {
      name: `after a blank line, it ends the steps`,
      input: `@1. S\n> body\n\n> [!NOTE]\n> text`,
      expected: `${OL}${LI(1)}${T}S</p>${B}<p>body</p></div></li></ol><blockquote><p>[!NOTE]\ntext</p></blockquote>`
    },
    {
      name: `nested after a blank line, it is a quote in the body`,
      input: `@1. S\n> body\n\n> > [!NOTE]\n> > text`,
      expected: `${OL}${LI(1)}${T}S</p>${B}<p>body</p><blockquote><p>[!NOTE]\ntext</p></blockquote></div></li></ol>`
    }
  ]
);

// A backslash is the only way to write a line that starts with `@1.` and isn't a step. remark and Sätteri read text after escapes and character references are resolved, so they saw a header where markdown-it, reading the line itself, sees none.
check(`steps: an escaped header is text`, [
  {
    name: `an escaped @ starts no steps`,
    input: `\\@1. Title`,
    expected: `<p>@1. Title</p>`
  },
  {
    name: `an escaped @ after a header ends the steps`,
    input: `@1. A\n\\@1. B`,
    expected: `${OL}${LI(1)}${T}A</p></li></ol><p>@1. B</p>`
  },
  {
    name: `an escaped @ in a body starts no steps there`,
    input: `@1. A\n> \\@1. not`,
    expected: `${OL}${LI(1)}${T}A</p>${B}<p>@1. not</p></div></li></ol>`
  },
  {
    name: `an escaped @ after a body, written without its marker, ends the steps`,
    input: `@1. A\n> x\n\\@1. B`,
    expected: `${OL}${LI(1)}${T}A</p>${B}<p>x</p></div></li></ol><p>@1. B</p>`
  },
  {
    name: `a character reference for @ starts no steps`,
    input: `&#64;1. Title`,
    expected: `<p>@1. Title</p>`
  },
  {
    name: `an escaped dot makes no header`,
    input: `@1\\. A`,
    expected: `<p>@1. A</p>`
  }
]);

// Indented four columns or more, a `>` is no blockquote marker in CommonMark: the line continues the paragraph before it, or is indented code after a blank line. remark and Sätteri have parsed it that way before recognition runs, so markdown-it's rule, which read the line without its indentation and took it for the body, reads it the same way.
check(`steps: a > indented four columns or more is not the body's marker`, [
  {
    name: `directly after a header it continues the header's paragraph, so it ends the steps as text`,
    input: `@1. S\n    > body`,
    expected: `${OL}${LI(1)}${T}S</p></li></ol><p>> body</p>`
  },
  {
    name: `the paragraph it starts goes on until a block interrupts it`,
    input: `@1. S\n    > body\nmore\n@1. B`,
    expected: `${OL}${LI(1)}${T}S</p></li></ol><p>> body\nmore</p>${OL}${LI(1)}${T}B</p></li></ol>`
  },
  {
    name: `a tab indents it as far`,
    input: `@1. S\n\t> body`,
    expected: `${OL}${LI(1)}${T}S</p></li></ol><p>> body</p>`
  },
  {
    name: `after a body line it continues the body's paragraph as text`,
    input: `@1. S\n> a\n    > b\n> c`,
    expected: `${OL}${LI(1)}${T}S</p>${B}<p>a\n> b\nc</p></div></li></ol>`
  },
  {
    name: `after a body's list item it continues the item's paragraph`,
    input: `@1. S\n> - a\n    > b`,
    expected: `${OL}${LI(1)}${T}S</p>${B}<ul><li>a\n> b</li></ul></div></li></ol>`
  },
  {
    name: `after a body's blank line it is indented code after the steps`,
    input: `@1. S\n> a\n>\n    > b`,
    expected: `${OL}${LI(1)}${T}S</p>${B}<p>a</p></div></li></ol><pre><code>> b\n</code></pre>`
  },
  {
    name: `after a blank line without the marker too`,
    input: `@1. S\n\n    > body`,
    expected: `${OL}${LI(1)}${T}S</p></li></ol><pre><code>> body\n</code></pre>`
  },
  {
    name: `in a list item the four columns count from the item's content`,
    input: `- @1. S\n      > body`,
    expected: `<ul><li>${OL}${LI(1)}${T}S</p></li></ol>\n> body</li></ul>`
  },
  {
    name: `a header indented that far after a blank line is indented code`,
    input: `> @1. A\n> > a\n>\n>     @1. B`,
    expected: `<blockquote>${OL}${LI(1)}${T}A</p>${B}<p>a</p></div></li></ol><pre><code>@1. B\n</code></pre></blockquote>`
  }
]);

// Known difference, pinned so a change to it is noticed. In a list item, a header after a line of text interrupts the paragraph in markdown-it, as its block rule does anywhere. remark and Sätteri leave such a line alone: by indentation they can't tell a header written in the item from one CommonMark lazily continued into it. A blank line before the header reads the same in every engine.
describe(`steps: a header after text in a list item (known difference)`, () => {
  const input = `- text\n  @1. Step\n  > Body.`;
  it.each(engines)(`$engine`, ({ engine, render }) => {
    const html = normalizeHtml(render(input));
    if (engine === `markdown-it`)
      expect(html).toBe(
        `<ul><li>text\n${OL}${LI(1)}${T}Step</p>${B}<p>Body.</p></div></li></ol></li></ul>`
      );
    else expect(html).not.toContain(`markdown-steps`);
  });
  it.each(engines)(
    `$engine: with a blank line before it, the header starts steps`,
    ({ render }) => {
      expect(normalizeHtml(render(`- text\n\n  @1. Step\n  > Body.`))).toBe(
        `<ul><li><p>text</p>${OL}${LI(1)}${T}Step</p>${B}<p>Body.</p></div></li></ol></li></ul>`
      );
    }
  );
});
