import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import {
  mirrordown as markdownItPreset,
  type MirrordownOptions as MarkdownItOptions
} from "../../packages/preset-markdown-it/src";
import {
  mirrordown as satteriPreset,
  type MirrordownOptions as SatteriOptions
} from "../../packages/preset-satteri/src";
import {
  mirrordown as remarkPreset,
  type MirrordownOptions as RemarkOptions
} from "../../packages/preset-remark/src";
import { normalizeHtml } from "../utils/index.js";

export type { MarkdownItOptions, RemarkOptions, SatteriOptions };

export const markdownIt = (options: MarkdownItOptions = {}) => {
  const md = new MarkdownIt().use(markdownItPreset, options);
  return (input: string): string => normalizeHtml(md.render(input));
};

export const remark = (options: RemarkOptions = {}) => {
  const preset = remarkPreset(options);
  const processor = unified()
    .use(remarkParse)
    .use(preset.remarkPlugins)
    .use(remarkRehype, preset.remarkRehype)
    .use(preset.rehypePlugins)
    // Diagrams are raw nodes, so their <svg> reaches the HTML as Pele wrote it.
    .use(rehypeStringify, { allowDangerousHtml: true });
  return (input: string): string =>
    normalizeHtml(String(processor.processSync(input)));
};

export const satteri = (options: SatteriOptions = {}) => {
  const preset = satteriPreset(options);
  return (input: string): string =>
    normalizeHtml(markdownToHtml(input, preset).html);
};

export const engines = [
  ["markdown-it", markdownIt],
  ["remark", remark],
  ["sätteri", satteri]
] as const;
