import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  isCjkCharacter,
  isIdeographicVariationSelector,
  isNonEmojiVariationSelector
} from "../../packages/core/src";
import { markdownIt, remark } from "../presets/engines.js";
import { options as mermaidPele } from "../mermaid-pele/options.js";
import { parseCases } from "../utils/index.js";

// R8 as a sweep: every document the suite already has, every other set's fixtures, the Obsidian corpus and every guide, rendered through each preset that has the plugin, with it on and off. A document with no CJK character beside a delimiter must come out the same.

const root = join(import.meta.dirname, `..`, `..`);
const tests = join(root, `tests`);

const fixtureDocuments = readdirSync(tests)
  .filter((set) => set !== `cjk-friendly`)
  .flatMap((set) => {
    const dir = join(tests, set, `fixtures`);
    let files: string[];
    try {
      files = readdirSync(dir).filter((file) => file.endsWith(`.md`));
    } catch {
      return [];
    }
    return files.flatMap((file) => {
      const text = readFileSync(join(dir, file), `utf8`);
      const split = parseCases(text);
      return (split.length > 0 ? split : [{ name: file, input: text }]).map(
        ({ name, input }) => ({ name: `${set}/${file} › ${name}`, input })
      );
    });
  });

const obsidianDocuments =
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  (
    JSON.parse(
      readFileSync(join(tests, `obsidian`, `fixtures`, `corpus.json`), `utf8`)
    ) as { cases: { id: string; markdown: string }[] }
  ).cases.map(({ id, markdown }) => ({
    name: `obsidian › ${id}`,
    input: markdown
  }));

const guides = join(root, `docs`, `public`, `guide`);
const guideDocuments = readdirSync(guides, { recursive: true })
  .map(String)
  .filter((file) => file.endsWith(`.md`))
  .map((file) => ({
    name: `guide › ${file}`,
    input: readFileSync(join(guides, file), `utf8`)
  }));

const documents = [
  ...fixtureDocuments,
  ...obsidianDocuments,
  ...guideDocuments
];

const DELIMITERS = new Set([`*`, `_`, `~`, `=`, `+`, `-`, `|`, `^`]);
// What can change a run's flanking under the amendment: a CJK character beside it, or a variation selector, which the amendment reads as part of the character before it.
const amendable = (codePoint: number): boolean =>
  isCjkCharacter(codePoint) ||
  isNonEmojiVariationSelector(codePoint) ||
  isIdeographicVariationSelector(codePoint);
const cjkBesideDelimiter = (text: string): boolean => {
  const characters = Array.from(text);
  return characters.some(
    (character, index) =>
      DELIMITERS.has(character) &&
      [characters[index - 1], characters[index + 1]].some(
        (beside) => beside !== undefined && amendable(beside.codePointAt(0)!)
      )
  );
};

describe.each([
  [`markdown-it`, markdownIt],
  [`remark`, remark]
])("cjk-friendly through the %s preset", (_, render) => {
  const on = render({ mermaidPele });
  const off = render({ mermaidPele, cjkFriendly: false });
  const changed = documents.filter(({ input }) => on(input) !== off(input));

  it("leaves every document with no CJK character beside a delimiter as it was", () => {
    expect(
      changed
        .filter(({ input }) => !cjkBesideDelimiter(input))
        .map(({ name }) => name)
    ).toStrictEqual([]);
  });

  it("sweeps the documents the suite has", () => {
    expect(documents.length).toBeGreaterThan(4000);
    expect(guideDocuments.length).toBeGreaterThan(20);
  });
});
