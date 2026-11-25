import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string): string => readFileSync(join(dir, path), `utf8`);

/** The cases of one fixture file, with their expected HTML. */
export const cases = (
  file: string
): Array<{ name: string; input: string; expected: string }> =>
  parseFixture(read(`fixtures/${file}.md`), read(`expected/${file}.html`));

/** The specification's corpus that both engines render alike: the files without GFM, and the two with it. */
export const SPEC = [
  `spec-strong`,
  `spec-korean`,
  `spec-non-bmp`,
  `spec-pseudo-emoji`,
  `spec-underscore-cjk-punct`
] as const;
export const SPEC_GFM = [`spec-strikethrough-gfm`, `spec-non-cjk-gfm`] as const;

/** Every case of the specification's corpus, wherever it is kept: the input is what matters to the comparisons with the reference packages. */
export const corpus = (): Array<{ name: string; input: string }> =>
  [...SPEC, ...SPEC_GFM, `spec-mdit`].flatMap(cases);

/** Every example of the CommonMark 0.31.2 specification, as the reference repository keeps them. */
export const commonMarkExamples = (): Array<{
  markdown: string;
  example: number;
}> =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  JSON.parse(read(`fixtures/commonmark.json`)) as Array<{
    markdown: string;
    example: number;
  }>;
