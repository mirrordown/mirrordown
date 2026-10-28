import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { tabs } from "../../packages/mdit-tabs/src";
import { steps } from "../../packages/mdit-steps/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import { normalizeHtml } from "../utils/index.js";
import { satteriSteps } from "../../packages/sat-steps/src";
import { satteriTabs } from "../../packages/sat-tabs/src";

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
          handlers: { ...stepsHastHandlers, ...tabsHastHandlers } as never
        })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(src)
    )
  );

// The same plugins in Sätteri, in the same order.
const sat = (src: string) =>
  normalizeHtml(
    markdownToHtml(src, {
      features: { gfm: true, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriSteps(), satteriTabs()]
    }).html
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

  it("remark: tab structure renders", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('aria-label="Quick start"');
    expect(result).toContain('aria-label="Reference"');
  });

  it("remark: steps render inside the tab body", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
    expect(result).toContain('data-step="3"');
  });

  it("remark: code fences inside steps inside tab render", () => {
    const result = remd(input);
    expect(result).toContain("git clone");
    expect(result).toContain("npm install");
    expect(result).toContain("npm run dev");
  });

  it("markdown-it: tab structure renders", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs"');
  });

  it("markdown-it: steps render inside the tab body", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
    expect(result).toContain('data-step="3"');
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });

  it("renders in markdown-it what remark does", () => {
    expect(normalizeHtml(md.render(input))).toBe(remd(input));
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

  it("remark: both tabs render", () => {
    const result = remd(input);
    expect(result).toContain('aria-label="macOS"');
    expect(result).toContain('aria-label="Windows"');
  });

  it("remark: steps render inside each tab", () => {
    const result = remd(input);
    // Two independent step lists — data-step="1" and data-step="2" appear in each
    expect(result.match(/data-step="1"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(result.match(/data-step="2"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("remark: content does not bleed between tab panels", () => {
    const result = remd(input);
    expect(result).toContain("brew install node");
    expect(result).toContain("winget install OpenJS.NodeJS");
  });

  it("markdown-it: both tabs and their steps render", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });

  it("renders in markdown-it what remark does", () => {
    expect(normalizeHtml(md.render(input))).toBe(remd(input));
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

  it("remark: tab renders", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('aria-label="Setup"');
    expect(result).toContain('aria-label="Skip ahead"');
  });

  it("remark: top-level and nested steps render inside the tab body", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-steps-list"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });

  it("remark: nested step content renders", () => {
    const result = remd(input);
    expect(result).toContain("mkdir my-project");
    expect(result).toContain("git init");
    expect(result).toContain("npm install");
  });

  it("markdown-it: nested steps inside tab render", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="markdown-steps"');
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });

  it("renders in markdown-it what remark does", () => {
    expect(normalizeHtml(md.render(input))).toBe(remd(input));
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

  it("remark: Demo and Code tabs both render", () => {
    const result = remd(input);
    expect(result).toContain('aria-label="Demo"');
    expect(result).toContain('aria-label="Code"');
  });

  it("remark: steps render inside the Demo tab", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });

  it("remark: Code tab contains a code fence, not a step list", () => {
    const result = remd(input);
    expect(result).toContain("<code");
    expect(result).toContain("@1.");
    // The @1. in the code fence should not produce a second step list
    expect(result.match(/class="markdown-steps"/g)?.length).toBe(1);
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });

  it("renders in markdown-it what remark does", () => {
    expect(normalizeHtml(md.render(input))).toBe(remd(input));
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

  it("remark: outer tab structure renders", () => {
    const result = remd(input);
    expect(result).toContain('aria-label="Guide"');
    expect(result).toContain('aria-label="Overview"');
  });

  it("remark: steps render inside the Guide tab", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });

  it("remark: nested tabs render inside the step body", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('aria-label="React"');
    expect(result).toContain('aria-label="Vue"');
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });

  it("renders in markdown-it what remark does", () => {
    expect(normalizeHtml(md.render(input))).toBe(remd(input));
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

  it("remark: both render independently", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).not.toContain('class="markdown-steps markdown-tabs"');
  });

  it("markdown-it: both render independently", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-tabs"');
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });

  it("renders in markdown-it what remark does", () => {
    expect(normalizeHtml(md.render(input))).toBe(remd(input));
  });
});

// Tabs end a group at a blank line by reading source positions, so they must survive steps rebuilding the tree before tabs run.
describe("tabs + steps: tab groups after steps stay separate at a blank line", () => {
  const input = `@1. Build
> Run the build.

% One
> First.

% Two
> Second.`;

  it.each([
    ["markdown-it", (src: string) => normalizeHtml(md.render(src))],
    ["remark", remd],
    ["Sätteri", sat]
  ])("%s", (_, render) => {
    expect(render(input).match(/<div class="markdown-tabs"/g)).toHaveLength(2);
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });

  it("renders in markdown-it what remark does", () => {
    expect(normalizeHtml(md.render(input))).toBe(remd(input));
  });
});
