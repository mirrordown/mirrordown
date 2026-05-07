import { expect, test, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { steps } from "../../packages/mdit-steps/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(steps).use(attrs);

// remarkAttrs runs after remarkSteps so it can visit stepsItem/stepsList nodes
const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkSteps)
        .use(remarkAttrs)
        .use(remarkRehype, { handlers: stepsHastHandlers as never })
        .use(rehypeStringify)
        .processSync(src),
    ),
  );

describe("steps + attrs: class on step container via paragraph attrs", () => {
  const input = "@1. Only step\n|  Body here.";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-steps-item"');
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-steps-item"');
  });
});

describe("steps + attrs: attrs on heading before step block", () => {
  const input = "## Setup {.section}\n\n@1. First step\n|  Content.";
  const expected =
    '<h2 class="section">Setup</h2><ol class="markdown-steps"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">First step</p><div class="markdown-steps-body"><p>Content.</p></div></li></ol>';

  test("markdown-it", () => expect(normalizeHtml(md.render(input))).toBe(expected));
  test("remark", () => expect(remd(input)).toBe(expected));
});

describe("steps + attrs: attrs on paragraph after step block", () => {
  const input = "@1. Only step\n|  Body.\n\nRead more. {.note}";
  const expectedStepClass = 'class="markdown-steps"';
  const expectedParaClass = 'class="note"';

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain(expectedStepClass);
    expect(result).toContain(expectedParaClass);
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain(expectedStepClass);
    expect(result).toContain(expectedParaClass);
  });
});

describe("steps + attrs: attrs on code fence inside step body", () => {
  const input = "@1. Install\n|\n|  ```ts {.example}\n|  const x = 1;\n|  ```";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps-item"');
    expect(result).toContain("<code");
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps-item"');
    expect(result).toContain("<code");
  });
});

describe("steps + attrs: step block and attrs coexist without interference", () => {
  const input =
    "Some *emphasized* text. {.intro}\n\n@1. Step one\n|  Body.\n@1. Step two\n\nAnother paragraph. {.outro}";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="intro"');
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="outro"');
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="intro"');
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="outro"');
  });
});

describe("steps + attrs: attr in step title applies to <li>", () => {
  // "@1. Step one {.complete}" → <li class="markdown-steps-item complete" data-step="1">
  // mdit: stepsItemEnd rule matches steps_item_open(-2) steps_title_open(-1) inline(0)
  // remd: stepsItem visitor applies hProperties to the node; buildListHast merges them
  const input = "@1. Step one {.complete}\n|  Some content.";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps-item complete"');
    expect(result).toContain('data-step="1"');
    expect(result).not.toContain("{.complete}");
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps-item complete"');
    expect(result).toContain('data-step="1"');
    expect(result).not.toContain("{.complete}");
  });
});

describe("steps + attrs: standalone attr paragraph after step list applies to <ol>", () => {
  // "@1. Step one\n| content\n{#instructions}" → <ol id="instructions" class="markdown-steps">
  // mdit: stepsListAttr rule matches steps_list_close(-2) paragraph_open(-1) inline(0)
  // remd: stepsList sibling visitor applies hProperties; buildListHast merges them
  const input = "@1. Step one\n|  Some content.\n\n{#instructions}";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('id="instructions"');
    expect(result).toContain('class="markdown-steps"');
    expect(result).not.toContain("<p>{#instructions}</p>");
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('id="instructions"');
    expect(result).toContain('class="markdown-steps"');
    expect(result).not.toContain("<p>{#instructions}</p>");
  });
});

describe("steps + attrs: multiple step items each with class", () => {
  const input = "@1. Done {.complete}\n|  Body.\n@1. In progress {.active}\n|  Body.";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps-item complete"');
    expect(result).toContain('class="markdown-steps-item active"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps-item complete"');
    expect(result).toContain('class="markdown-steps-item active"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });
});

describe("steps + attrs: attrs on standard ordered list adjacent to step block are unaffected", () => {
  // Verify attrs work on real ordered lists alongside steps, with no cross-contamination.
  const input =
    "@1. A step\n|  Step body.\n\n{#step-list}\n\n1. List item one\n2. List item two\n\n{.my-list}";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('id="step-list"');
    expect(result).toContain('class="my-list"');
    expect(result).not.toMatch(/class="markdown-steps my-list"/);
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('id="step-list"');
    expect(result).toContain('class="my-list"');
    expect(result).not.toMatch(/class="markdown-steps my-list"/);
  });
});
