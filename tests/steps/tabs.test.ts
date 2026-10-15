import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { steps } from "../../packages/mdit-steps/src";
import { tabs } from "../../packages/mdit-tabs/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
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

// ── Flat tabs inside a step body ──────────────────────────────────────────────

describe("steps + tabs: flat tabs inside a single step body", () => {
  const input = `@1. Install the package
> % npm
> > \`\`\`sh
> > npm install my-pkg
> > \`\`\`
> % pnpm
> > \`\`\`sh
> > pnpm add my-pkg
> > \`\`\``;

  it("remark: step renders with correct structure", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('data-step="1"');
  });

  it("remark: tabs render inside the step body", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('aria-label="npm"');
    expect(result).toContain('aria-label="pnpm"');
  });

  it("remark: code fences inside tabs render", () => {
    const result = remd(input);
    expect(result).toContain("<code");
    expect(result).toContain("npm install my-pkg");
    expect(result).toContain("pnpm add my-pkg");
  });

  it("markdown-it: step renders with correct structure", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('data-step="1"');
  });

  it("markdown-it: tabs render inside the step body", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs"');
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });
});

// ── Multiple steps each containing tabs ───────────────────────────────────────

describe("steps + tabs: multiple steps each containing tabs", () => {
  const input = `@1. Choose a package manager
> % npm
> > Use npm for Node projects.
>
> % yarn
> > Use yarn for Yarn workspaces.

@2. Run the install command
> % npm
> > \`\`\`sh
> > npm install
> > \`\`\`
> % yarn
> > \`\`\`sh
> > yarn
> > \`\`\``;

  it("remark: both steps render", () => {
    const result = remd(input);
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });

  it("remark: tabs render inside each step body", () => {
    const result = remd(input);
    // Two separate tab groups — two occurrences of the class
    expect(
      result.match(/class="markdown-tabs"/g)?.length
    ).toBeGreaterThanOrEqual(2);
  });

  it("remark: content from different steps does not bleed across tab groups", () => {
    const result = remd(input);
    expect(result).toContain("Use npm for Node projects");
    expect(result).toContain("npm install");
  });

  it("markdown-it: both steps and their tabs render", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
    expect(result).toContain('class="markdown-tabs"');
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });
});

// ── Nested tabs (%%}) inside a step body ─────────────────────────────────────

describe("steps + tabs: nested tabs inside a step body", () => {
  const input = `@1. Set up your framework
> % Frontend
> %% React
> > Install React and ReactDOM.
>
> %% Vue
> > Install Vue.
> % Backend
> > Use any server runtime.`;

  it("remark: step renders", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('data-step="1"');
  });

  it("remark: outer and inner tabs render inside step body", () => {
    const result = remd(input);
    // At minimum two tab group wrappers: outer + nested
    expect(
      result.match(/class="markdown-tabs"/g)?.length
    ).toBeGreaterThanOrEqual(2);
    expect(result).toContain('aria-label="Frontend"');
    expect(result).toContain('aria-label="Backend"');
    expect(result).toContain('aria-label="React"');
    expect(result).toContain('aria-label="Vue"');
  });

  it("markdown-it: nested tabs inside step render", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-tabs"');
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });
});

// ── Tabs inside a nested step (@@) ────────────────────────────────────────────

describe("steps + tabs: tabs inside a nested step body", () => {
  const input = `@1. Configure the project
@@1. Pick a bundler
> % Vite
> > Fast dev server and build tool.
>
> % Webpack
> > Mature and highly configurable.
@@2. Install dependencies
> \`\`\`sh
> npm install
> \`\`\`
@2. Start the server
> \`\`\`sh
> npm run dev
> \`\`\``;

  it("remark: top-level and nested steps render", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-steps-list"');
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });

  it("remark: tabs render inside the nested step body", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('aria-label="Vite"');
    expect(result).toContain('aria-label="Webpack"');
  });

  it("remark: sibling nested step without tabs renders normally", () => {
    const result = remd(input);
    expect(result).toContain("npm install");
    expect(result).toContain("npm run dev");
  });

  it("markdown-it: nested steps and tabs render", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-tabs"');
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });
});

// ── Step body with both prose and tabs ────────────────────────────────────────

describe("steps + tabs: step body containing both prose and tabs", () => {
  const input = `@1. Install using your preferred package manager
> Choose the one that matches your project:
>
> % npm
> > \`\`\`sh
> > npm install my-pkg
> > \`\`\`
> % pnpm
> > \`\`\`sh
> > pnpm add my-pkg
> > \`\`\``;

  it("remark: step renders with prose and tabs both present", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain("Choose the one that matches your project");
  });

  it("markdown-it: prose and tabs coexist inside step body", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain("Choose the one that matches your project");
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });
});

// ── Steps alongside tabs at the root level ────────────────────────────────────

describe("steps + tabs: steps and tabs adjacent at the root level", () => {
  const input = `% npm
> \`\`\`sh
> npm install
> \`\`\`
% pnpm
> \`\`\`sh
> pnpm add
> \`\`\`

@1. Verify the install
> \`\`\`sh
> node -e "require('my-pkg')"
> \`\`\``;

  it("remark: both render independently", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="markdown-steps"');
    expect(result).not.toContain('class="markdown-tabs markdown-steps"');
  });

  it("markdown-it: both render independently", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('class="markdown-steps"');
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });
});
