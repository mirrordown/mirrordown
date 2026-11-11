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
  describe(title, () => {
    describe.each(cases)(`$name`, ({ input, expected }) => {
      it.each(engines)(`$engine`, ({ render }) => {
        expect(normalizeHtml(render(input))).toBe(expected);
      });
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
check(`steps: a line is placed by its own source line, after inline content that spans lines`, [
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
]);

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
check(`steps: the lines that end a group are read as the blocks they are written as`, [
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
]);

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
