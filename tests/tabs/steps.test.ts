import { expect, test, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { tabs } from "../../packages/mdit-tabs/src";
import { steps } from "../../packages/mdit-steps/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(steps).use(tabs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkSteps)
        .use(remarkTabs)
        .use(remarkRehype, {
          handlers: { ...stepsHastHandlers, ...tabsHastHandlers } as never,
        })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(src),
    ),
  );

// ── Flat steps inside a tab body ──────────────────────────────────────────────

describe("tabs + steps: flat steps inside a single tab body", () => {
  const input = `% Quick start
> @1. Clone the repo
> > \`\`\`sh
> > git clone https://example.com/repo.git
> > \`\`\`
> @2. Install dependencies
> > \`\`\`sh
> > npm install
> > \`\`\`
> @3. Start the server
> > \`\`\`sh
> > npm run dev
> > \`\`\`
% Reference
> See the full API docs.`;

  test("remark: tab structure renders", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('aria-label="Quick start"');
    expect(result).toContain('aria-label="Reference"');
  });

  test("remark: steps render inside the tab body", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
    expect(result).toContain('data-step="3"');
  });

  test("remark: code fences inside steps inside tab render", () => {
    const result = remd(input);
    expect(result).toContain("git clone");
    expect(result).toContain("npm install");
    expect(result).toContain("npm run dev");
  });

  test("markdown-it: tab structure renders", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs"');
  });

  test("markdown-it: steps render inside the tab body", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
    expect(result).toContain('data-step="3"');
  });
});

// ── Multiple tabs each containing steps ───────────────────────────────────────

describe("tabs + steps: multiple tabs each containing steps", () => {
  const input = `% macOS
> @1. Install Homebrew
> > \`\`\`sh
> > /bin/bash -c "$(curl -fsSL https://brew.sh/install.sh)"
> > \`\`\`
> @2. Install Node
> > \`\`\`sh
> > brew install node
> > \`\`\`
% Windows
> @1. Install winget
> > \`\`\`sh
> > winget install Microsoft.WinGet
> > \`\`\`
> @2. Install Node
> > \`\`\`sh
> > winget install OpenJS.NodeJS
> > \`\`\``;

  test("remark: both tabs render", () => {
    const result = remd(input);
    expect(result).toContain('aria-label="macOS"');
    expect(result).toContain('aria-label="Windows"');
  });

  test("remark: steps render inside each tab", () => {
    const result = remd(input);
    // Two independent step lists — data-step="1" and data-step="2" appear in each
    expect(result.match(/data-step="1"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(result.match(/data-step="2"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  test("remark: content does not bleed between tab panels", () => {
    const result = remd(input);
    expect(result).toContain("brew install node");
    expect(result).toContain("winget install OpenJS.NodeJS");
  });

  test("markdown-it: both tabs and their steps render", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });
});

// ── Nested steps (@@) inside a tab body ───────────────────────────────────────

describe("tabs + steps: nested steps inside a tab body", () => {
  const input = `% Setup
> @1. Configure the project
> @@1. Create the directory
> > \`\`\`sh
> > mkdir my-project && cd my-project
> > \`\`\`
> @@2. Initialize git
> > \`\`\`sh
> > git init
> > \`\`\`
> @2. Install dependencies
> > \`\`\`sh
> > npm install
> > \`\`\`
% Skip ahead
> Jump to the advanced guide.`;

  test("remark: tab renders", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('aria-label="Setup"');
    expect(result).toContain('aria-label="Skip ahead"');
  });

  test("remark: top-level and nested steps render inside the tab body", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-steps-list"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });

  test("remark: nested step content renders", () => {
    const result = remd(input);
    expect(result).toContain("mkdir my-project");
    expect(result).toContain("git init");
    expect(result).toContain("npm install");
  });

  test("markdown-it: nested steps inside tab render", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="markdown-steps"');
  });
});

// ── Nested tabs (Demo/Code pattern) containing steps ─────────────────────────

describe("tabs + steps: Demo/Code tab pair wrapping steps syntax", () => {
  const input = `% Demo
> @1. First step
> > Do the first thing.
> @2. Second step
> > Do the second thing.
>
% Code
> \`\`\`\`markdown
> @1. First step
> > Do the first thing.
> @2. Second step
> > Do the second thing.
> \`\`\`\``;

  test("remark: Demo and Code tabs both render", () => {
    const result = remd(input);
    expect(result).toContain('aria-label="Demo"');
    expect(result).toContain('aria-label="Code"');
  });

  test("remark: steps render inside the Demo tab", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });

  test("remark: Code tab contains a code fence, not a step list", () => {
    const result = remd(input);
    expect(result).toContain("<code");
    expect(result).toContain("@1.");
    // The @1. in the code fence should not produce a second step list
    expect(result.match(/class="markdown-steps"/g)?.length).toBe(1);
  });
});

// ── Nested tabs (%%)) inside a tab that also contains steps ───────────────────

describe("tabs + steps: nested tabs alongside steps within the same tab body", () => {
  const input = `% Guide
> @1. Pick your stack
> > % React
> > > Build a SPA with React.
> >
> > % Vue
> > > Build a SPA with Vue.
>
> @2. Run the project
> > \`\`\`sh
> > npm run dev
> > \`\`\`
>
% Overview
> A brief intro paragraph.`;

  test("remark: outer tab structure renders", () => {
    const result = remd(input);
    expect(result).toContain('aria-label="Guide"');
    expect(result).toContain('aria-label="Overview"');
  });

  test("remark: steps render inside the Guide tab", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });

  test("remark: nested tabs render inside the step body", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('aria-label="React"');
    expect(result).toContain('aria-label="Vue"');
  });
});

// ── Steps and tabs adjacent at the root level ─────────────────────────────────

describe("tabs + steps: steps and tabs adjacent at the root level", () => {
  const input = `@1. Run the build
> \`\`\`sh
> npm run build
> \`\`\`

% Output formats
> % ESM
> > Import with \`import\`.
> % CJS
> > Require with \`require\`.`;

  test("remark: both render independently", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).not.toContain('class="markdown-steps markdown-tabs"');
  });

  test("markdown-it: both render independently", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-tabs"');
  });
});
