import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Construct, State } from "micromark-util-types";
import {
  micromarkAfter,
  micromarkBefore,
  type Neighbour
} from "../../packages/core/src";

// micromark hands a tokenizer one code unit at a time, so a character outside the Basic Multilingual Plane arrives as two surrogates, neither of them whitespace or punctuation. CommonMark, markdown-it and Sätteri read the whole character, so the readers that remd-cjk-friendly's constructs and Mirrordown's `~` and `^` use read it whole too: an emoji or a mathematical symbol beside a run is punctuation, an astral letter is a letter. A surrogate without its other half stays what micromark makes of it.

// Records what the readers say about the `*` runs of a document, then gives way to micromark's own emphasis.
const neighbours = (
  input: string
): { before: Neighbour; after: Neighbour }[] => {
  const found: { before: Neighbour; after: Neighbour }[] = [];
  const record: Construct = {
    name: `record`,
    tokenize(effects, _ok, nok) {
      const { before } = micromarkBefore(this);
      const inside: State = (code) => {
        if (code === 42) {
          effects.consume(code);
          return inside;
        }
        found.push({ before, after: micromarkAfter(this, code) });
        return nok(code);
      };
      return (code) => {
        effects.enter(`data`);
        return inside(code);
      };
    }
  };
  unified()
    .use(remarkParse)
    .use(function () {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const data = this.data() as { micromarkExtensions?: unknown[] };
      (data.micromarkExtensions ??= []).push({ text: { 42: record } });
    })
    .parse(input);
  return found;
};

describe("core: micromarkBefore and micromarkAfter", () => {
  it.each([
    [`an emoji, a symbol (So)`, `🎉*a`, 0x1f389],
    [`a mathematical symbol (Sm)`, `𝜵*a`, 0x1d735],
    [`astral punctuation (Po)`, `𐬻*a`, 0x10b3b]
  ])("reads %s before a run whole, as punctuation", (_, input, codePoint) => {
    expect(neighbours(input)[0]?.before).toStrictEqual({
      kind: `punctuation`,
      codePoint
    });
  });

  it.each([
    [`an emoji, a symbol (So)`, `a*🎉`, 0x1f389],
    [`a mathematical symbol (Sm)`, `a*𝜵`, 0x1d735],
    [`astral punctuation (Po)`, `a*𐬻`, 0x10b3b]
  ])("reads %s after a run whole, as punctuation", (_, input, codePoint) => {
    expect(neighbours(input)[0]?.after).toStrictEqual({
      kind: `punctuation`,
      codePoint
    });
  });

  // An ideograph outside the Basic Multilingual Plane is a letter (Lo), as it always was; whole, it is also a CJK character, which the amendment tests.
  it("reads an astral letter as a letter, on either side", () => {
    expect(neighbours(`𠮷*𠮷`)[0]).toStrictEqual({
      before: { kind: `other`, codePoint: 0x20bb7 },
      after: { kind: `other`, codePoint: 0x20bb7 }
    });
  });

  // Half a pair is no character: it stays the code unit micromark handed over, neither whitespace nor punctuation.
  it.each([
    [`a lone high surrogate before`, `a\ud83c*a`, `before`, 0xd83c],
    [`a lone low surrogate before`, `a\udf89*a`, `before`, 0xdf89],
    [`a lone high surrogate after`, `a*\ud83ca`, `after`, 0xd83c],
    [`a lone low surrogate after`, `a*\udf89a`, `after`, 0xdf89]
  ] as const)("reads %s as itself", (_, input, side, codePoint) => {
    expect(neighbours(input)[0]?.[side]).toStrictEqual({
      kind: `other`,
      codePoint
    });
  });

  // Codes micromark makes that are not characters of the text: the start of the content, and a line ending.
  it("reads the edges of a line as whitespace", () => {
    expect(neighbours(`*a\nb*`)).toStrictEqual([
      {
        before: { kind: `whitespace` },
        after: { kind: `other`, codePoint: 0x61 }
      },
      {
        before: { kind: `other`, codePoint: 0x62 },
        after: { kind: `whitespace` }
      }
    ]);
  });
});
