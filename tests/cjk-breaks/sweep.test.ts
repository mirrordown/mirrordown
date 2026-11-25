import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { cjkBreakRemoved, codePointBefore } from "../../packages/core/src";
import { mirrordown as markdownItPreset } from "../../packages/preset-markdown-it/src";
import { mirrordown as remarkPreset } from "../../packages/preset-remark/src";
import { mirrordown as satteriPreset } from "../../packages/preset-satteri/src";
import { options as mermaidPele } from "../mermaid-pele/options.js";
import { parseCases } from "../utils/index.js";

// R8: a document with no soft break between two wide characters renders byte for byte as it does without the plugin. Every fixture case of every other set and every guide goes through each preset with `cjkBreaks` on and off, and the two renderings are compared as the engine writes them: equal, or the same but for line endings the plugin removed, each in the text and between two characters the rule removes a break between (read through tags). Anything else is a change the plugin made to a document it should have left alone.
type Render = (input: string) => string;

const presets = (cjkBreaks: boolean): [string, Render][] => {
  const md = new MarkdownIt().use(markdownItPreset, {
    mermaidPele,
    cjkBreaks
  });
  const remark = remarkPreset({ mermaidPele, cjkBreaks });
  const processor = unified()
    .use(remarkParse)
    .use(remark.remarkPlugins)
    .use(remarkRehype, remark.remarkRehype)
    .use(remark.rehypePlugins)
    .use(rehypeStringify, { allowDangerousHtml: true });
  const satteri = satteriPreset({ mermaidPele, cjkBreaks });
  return [
    [`markdown-it`, (input) => md.render(input)],
    [`remark`, (input) => String(processor.processSync(input))],
    [`sätteri`, (input) => markdownToHtml(input, satteri).html]
  ];
};

// The character that ends at `index` of HTML text (`step` -1) or starts there (1), stepping over tags, and over a ruby's reading and parentheses as the rule does; empty at either end.
const visible = (html: string, index: number, step: -1 | 1): string => {
  let i = index;
  for (;;) {
    if (step < 0) {
      if (i <= 0) return ``;
      if (html.charAt(i - 1) !== `>`) {
        return String.fromCodePoint(codePointBefore(html, i)!);
      }
      const start = html.lastIndexOf(`<`, i - 1);
      const annotation = /^<\/(rt|rp)>$/.exec(html.slice(start, i))?.[1];
      i = annotation ? html.lastIndexOf(`<${annotation}`, start) : start;
    } else {
      if (i >= html.length) return ``;
      if (html.charAt(i) !== `<`) {
        return String.fromCodePoint(html.codePointAt(i)!);
      }
      const annotation = /^<(rt|rp)[\s>]/.exec(html.slice(i, i + 4))?.[1];
      const close = annotation ? `</${annotation}>` : `>`;
      const end = html.indexOf(close, i);
      if (end < 0) return ``;
      i = end + close.length;
    }
  }
};

// Why `on` differs from `off`, or `undefined` when it differs only by line endings the plugin was right to remove.
const unexplained = (off: string, on: string): string | undefined => {
  let i = 0;
  let j = 0;
  let inTag = false;
  while (i < off.length || j < on.length) {
    if (off.charAt(i) === on.charAt(j) && i < off.length) {
      if (off.charAt(i) === `<`) inTag = true;
      if (off.charAt(i) === `>`) inTag = false;
      i++;
      j++;
      continue;
    }
    const ending = /^(?:\r\n|\r|\n)/.exec(off.slice(i, i + 2))?.[0];
    if (!ending) return `differs at ${String(i)}: ${off.slice(i, i + 40)}`;
    if (inTag) return `removed a line ending inside a tag at ${String(i)}`;
    const before = visible(off, i, -1);
    const after = visible(off, i + ending.length, 1);
    if (!cjkBreakRemoved(before, after))
      return `removed a line ending between ${JSON.stringify(before)} and ${JSON.stringify(after)}`;
    i += ending.length;
  }
  return undefined;
};

const tests = join(import.meta.dirname, `..`);
const cases = readdirSync(tests)
  .filter((set) => set !== `cjk-breaks`)
  .flatMap((set) => {
    let files: string[];
    try {
      files = readdirSync(join(tests, set, `fixtures`));
    } catch {
      return [];
    }
    return files
      .filter((file) => file.endsWith(`.md`))
      .flatMap((file) =>
        parseCases(
          readFileSync(join(tests, set, `fixtures`, file), `utf8`)
        ).map(({ name, input }) => ({ name: `${file} › ${name}`, input }))
      );
  });
const guides = join(import.meta.dirname, `../../docs/public/guide`);
const documents = [
  ...cases,
  ...readdirSync(guides, { recursive: true, encoding: `utf8` })
    .filter((path) => path.endsWith(`.md`))
    .map((path) => ({
      name: `guide ${path.replaceAll(`\\`, `/`)}`,
      input: readFileSync(join(guides, path), `utf8`)
    }))
];

// This set's own fixtures, where the plugin has breaks to remove: the comparison has to see them, and explain every one.
const own = readdirSync(join(import.meta.dirname, `fixtures`)).flatMap((file) =>
  parseCases(
    readFileSync(join(import.meta.dirname, `fixtures`, file), `utf8`)
  ).map(({ name, input }) => ({ name: `${file} › ${name}`, input }))
);

const sweep = (
  inputs: readonly { name: string; input: string }[],
  withPlugin: Render,
  without: Render
): { changed: string[]; problems: string[] } => {
  const changed: string[] = [];
  const problems: string[] = [];
  for (const { name, input } of inputs) {
    const before = without(input);
    const after = withPlugin(input);
    if (before === after) continue;
    changed.push(name);
    const why = unexplained(before, after);
    if (why) problems.push(`${name}: ${why}`);
  }
  return { changed, problems };
};

describe(`cjk-breaks leaves a document alone unless it has a break to remove`, () => {
  const on = presets(true);
  const off = presets(false);
  const engines = on.map(([engine], index) => [engine, index] as const);

  it.each(engines)(
    `%s: every other set's fixtures and every guide`,
    { timeout: 300_000 },
    (_, index) => {
      const { problems } = sweep(documents, on[index][1], off[index][1]);
      expect(problems).toStrictEqual([]);
    }
  );

  it.each(engines)(
    `%s: this set's fixtures, whose removed breaks it explains`,
    { timeout: 120_000 },
    (_, index) => {
      const { changed, problems } = sweep(own, on[index][1], off[index][1]);
      expect(changed.length).toBeGreaterThan(0);
      expect(problems).toStrictEqual([]);
    }
  );

  it(`does not explain a removed break the rule would keep, or any other change`, () => {
    expect(unexplained(`<p>a\nb</p>`, `<p>ab</p>`)).toBeDefined();
    expect(unexplained(`<p>日\n本</p>`, `<p>日本 </p>`)).toBeDefined();
    expect(unexplained(`<a title="日\n本">`, `<a title="日本">`)).toBeDefined();
    expect(unexplained(`<p><b>日</b>\n本</p>`, `<p><b>日</b>本</p>`)).toBe(
      undefined
    );
  });
});
