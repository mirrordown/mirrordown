import { expect, it, describe } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers
} from "../../packages/remd-github-alerts/src";
import { normalizeHtml } from "../utils/index.js";
import { satteriGithubAlerts } from "../../packages/sat-github-alerts/src";
import { satteriTabs } from "../../packages/sat-tabs/src";

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkGithubAlerts)
        .use(remarkTabs)
        .use(remarkRehype, {
          handlers: {
            ...githubAlertsHastHandlers,
            ...tabsHastHandlers
          } as never
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
      mdastPlugins: [satteriGithubAlerts(), satteriTabs()]
    }).html
  );

// A blank `>` line before `% Code` is required to prevent lazy continuation
// from absorbing `% Code` into the last alert's paragraph text.
const singleAlertInput = `% Demo
> > [!NOTE]
> > Useful information that users should know, even if skimming.
>
% Code
> \`\`\`\`markdown
> > [!NOTE]
> > Useful information that users should know, even if skimming.
> \`\`\`\``;

const allAlertsInput = `% Demo
> > [!NOTE]
> > Note content.
>
> > [!TIP]
> > Tip content.
>
> > [!IMPORTANT]
> > Important content.
>
> > [!WARNING]
> > Warning content.
>
> > [!CAUTION]
> > Caution content.
>
% Code
> \`\`\`\`markdown
> > [!NOTE]
> > Note content.
> \`\`\`\``;

describe("tabs + github-alerts: alert inside tab body renders as alert", () => {
  it("remark: produces two tab labels", () => {
    const result = remd(singleAlertInput);
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('aria-label="Demo"');
    expect(result).toContain('aria-label="Code"');
  });

  it("remark: alert inside Demo tab renders with correct class", () => {
    const result = remd(singleAlertInput);
    expect(result).toContain('data-alert="note"');
    expect(result).toContain("markdown-alert");
  });

  it("remark: Code tab renders a code fence, not an alert", () => {
    const result = remd(singleAlertInput);
    expect(result).toContain("<code");
    expect(result).toContain("[!NOTE]");
    // The % Code label should not appear as body text
    expect(result).not.toContain("% Code</p>");
  });

  it("remark: % Code is not absorbed into the alert body", () => {
    const result = remd(singleAlertInput);
    // Without the blank `>` separator, `% Code` ends up inside the alert paragraph
    expect(result).not.toContain("% Code</p>");
    expect(result).not.toContain("% Code<");
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(singleAlertInput)).toBe(remd(singleAlertInput));
  });
});

describe("tabs + github-alerts: all five alert types inside tab body", () => {
  it("remark: all alert types render correctly inside Demo tab", () => {
    const result = remd(allAlertsInput);
    expect(result).toContain('data-alert="note"');
    expect(result).toContain('data-alert="tip"');
    expect(result).toContain('data-alert="important"');
    expect(result).toContain('data-alert="warning"');
    expect(result).toContain('data-alert="caution"');
  });

  it("remark: Code tab contains a code fence", () => {
    const result = remd(allAlertsInput);
    expect(result).toContain("<code");
    expect(result).toContain("[!NOTE]");
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(allAlertsInput)).toBe(remd(allAlertsInput));
  });
});

describe("tabs + github-alerts: alert alongside tabs does not break tab structure", () => {
  const input = `> [!NOTE]
> A standalone alert before tabs.

% Tab One
> Content for tab one.
% Tab Two
> Content for tab two.`;

  it("remark: standalone alert and tabs both render", () => {
    const result = remd(input);
    expect(result).toContain('data-alert="note"');
    expect(result).toContain('class="markdown-tabs"');
    expect(result).toContain('aria-label="Tab One"');
    expect(result).toContain('aria-label="Tab Two"');
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });
});

describe("tabs + github-alerts: foldable alert inside tab body", () => {
  const input = `% Demo
> > [!TIP]+
> > This tip is open by default.
>
> > [!WARNING]-
> > This warning is collapsed.
>
% Code
> \`\`\`\`markdown
> > [!TIP]+
> > This tip is open by default.
> \`\`\`\``;

  it("remark: foldable alerts render as details elements inside tab body", () => {
    const result = remd(input);
    expect(result).toContain('data-alert="tip"');
    expect(result).toContain('data-alert="warning"');
    expect(result).toContain("<details");
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });
});

describe("tabs + github-alerts: custom title alert inside tab body", () => {
  const input = `% Demo
> > [!NOTE] Custom Title
> > This alert uses a custom title.
>
% Code
> \`\`\`\`markdown
> > [!NOTE] Custom Title
> > This alert uses a custom title.
> \`\`\`\``;

  it("remark: custom title renders in alert", () => {
    const result = remd(input);
    expect(result).toContain('data-alert="note"');
    expect(result).toContain("Custom Title");
  });

  it("renders in Sätteri what remark does", () => {
    expect(sat(input)).toBe(remd(input));
  });
});
