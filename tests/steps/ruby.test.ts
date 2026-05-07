import { expect, test, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { steps } from "../../packages/mdit-steps/src";
import { ruby } from "../../packages/mdit-ruby/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import { remarkRuby } from "../../packages/remd-ruby/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(steps).use(ruby);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkRuby)
        .use(remarkSteps)
        .use(remarkRehype, { handlers: stepsHastHandlers as never })
        .use(rehypeStringify)
        .processSync(src),
    ),
  );

describe("steps + ruby: ruby annotation in step title", () => {
  const input = "@1. Learn {漢字|かんじ}\n>  Study the characters.";
  const expectedTitle = "<ruby>漢字<rt>かんじ</rt></ruby>";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain(expectedTitle);
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain(expectedTitle);
  });
});

describe("steps + ruby: ruby annotation in step body", () => {
  const input = "@1. Japanese step\n>\n>  Read {日本語|にほんご} carefully.";
  const expectedRuby = "<ruby>日本語<rt>にほんご</rt></ruby>";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain('class="markdown-steps-body"');
    expect(result).toContain(expectedRuby);
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain('class="markdown-steps-body"');
    expect(result).toContain(expectedRuby);
  });
});

describe("steps + ruby: multiple steps each with ruby", () => {
  const input = "@1. {東京|とうきょう}\n>  The capital.\n@1. {大阪|おおさか}\n>  The second city.";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain("<ruby>東京<rt>とうきょう</rt></ruby>");
    expect(result).toContain("<ruby>大阪<rt>おおさか</rt></ruby>");
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain("<ruby>東京<rt>とうきょう</rt></ruby>");
    expect(result).toContain("<ruby>大阪<rt>おおさか</rt></ruby>");
    expect(result).toContain('data-step="1"');
    expect(result).toContain('data-step="2"');
  });
});

describe("steps + ruby: ruby and steps coexist without interference", () => {
  const input = "{漢字|かんじ}\n\n@1. A step\n>  Plain body.\n\n{仮名|かな}";

  test("markdown-it", () => {
    const result = normalizeHtml(md.render(input));
    expect(result).toContain("<ruby>漢字<rt>かんじ</rt></ruby>");
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain("<ruby>仮名<rt>かな</rt></ruby>");
  });

  test("remark", () => {
    const result = remd(input);
    expect(result).toContain("<ruby>漢字<rt>かんじ</rt></ruby>");
    expect(result).toContain('class="markdown-steps"');
    expect(result).toContain("<ruby>仮名<rt>かな</rt></ruby>");
  });
});
