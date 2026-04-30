import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type MarkdownIt from "markdown-it";
import type { RenderRule } from "markdown-it/lib/renderer.mjs";

export const inlineSvg = (md: MarkdownIt): void => {
  const imageRule = md.renderer.rules.image;
  if (!imageRule) return;

  const tokenizer: RenderRule = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const src = token.attrGet(`src`);
    if (
      !src ||
      /^(?:[a-z]+:|\/\/)/i.test(src) ||
      !src.endsWith(`.svg`) ||
      typeof env.currentDocument === `undefined`
    ) {
      return imageRule(tokens, idx, options, env, self);
    }

    let svgPath = decodeURIComponent(src);

    if (svgPath.startsWith(`/`)) {
      svgPath = svgPath.slice(1);
    } else {
      const currentFile = env.currentDocument.toString();
      const relativePathDir = fileURLToPath(dirname(currentFile));
      svgPath = join(relativePathDir, svgPath);
      if (svgPath.startsWith(`/`)) svgPath = svgPath.slice(1);
    }

    try {
      const svgContent = readFileSync(svgPath, `utf-8`);
      return svgContent;
    } catch (err) {
      console.error(`Could not read SVG file: ${src}`, { cause: err });
      return imageRule(tokens, idx, options, env, self);
    }
  };

  md.renderer.rules.image = tokenizer;
};
