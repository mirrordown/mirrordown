import { describe, expect, it } from "vite-plus/test";
import {
  isCjkAmbiguousPunctuationSequence,
  isCjkCharacter,
  isEastAsianWide,
  isNonEmojiVariationSelector
} from "../../packages/core/src";
import { UNICODE_VERSION } from "../../packages/core/src/cjk-ranges";

// The lists of the CJK-friendly specification's ranges.md (https://github.com/tats-u/markdown-cjk-friendly/blob/caa37236186e0d294cd6da255a1bdde81dbc0f50/ranges.md), copied without the sample characters. The specification's author computes them from the Unicode data with a script of his own, so they check our generator from outside: a difference is a misread data file on one side.

const CJK_CHARACTERS = `
U+1100..U+11FF
U+20A9
U+2329..U+232A
U+2630..U+2637
U+268A..U+268F
U+2E80..U+2E99
U+2E9B..U+2EF3
U+2F00..U+2FD5
U+2FF0..U+303E
U+3041..U+3096
U+3099..U+30FF
U+3105..U+312F
U+3131..U+318E
U+3190..U+31E5
U+31EF..U+321E
U+3220..U+3247
U+3250..U+A48C
U+A490..U+A4C6
U+A960..U+A97C
U+AC00..U+D7A3
U+D7B0..U+D7C6
U+D7CB..U+D7FB
U+F900..U+FAFF
U+FE10..U+FE19
U+FE30..U+FE52
U+FE54..U+FE66
U+FE68..U+FE6B
U+FF01..U+FFBE
U+FFC2..U+FFC7
U+FFCA..U+FFCF
U+FFD2..U+FFD7
U+FFDA..U+FFDC
U+FFE0..U+FFE6
U+FFE8..U+FFEE
U+16FE0..U+16FE4
U+16FF0..U+16FF6
U+17000..U+18CDA
U+18CFF..U+18D20
U+18D80..U+18DF2
U+18E00..U+19191
U+191A0..U+191D2
U+1AFF0..U+1AFF3
U+1AFF5..U+1AFFB
U+1AFFD..U+1AFFE
U+1B000..U+1B128
U+1B132
U+1B150..U+1B152
U+1B155
U+1B164..U+1B168
U+1B170..U+1B2FB
U+1D300..U+1D356
U+1D360..U+1D376
U+1F1AE
U+1F200
U+1F202
U+1F210..U+1F219
U+1F21B..U+1F22E
U+1F230..U+1F231
U+1F237
U+1F23B
U+1F240..U+1F248
U+1F260..U+1F265
U+1F7DA
U+20000..U+3FFFD
`;

const NON_EMOJI_VARIATION_SELECTORS = `
U+FE00..U+FE0E
`;

const WIDE_IF_UNASSIGNED = `
U+3400..U+4DBF
U+4E00..U+9FFF
U+F900..U+FAFF
U+20000..U+3FFFD
`;

const CJK_AMBIGUOUS_PUNCTUATION_SEQUENCES = `
U+2018 U+FE01
U+2019 U+FE01
U+201C U+FE01
U+201D U+FE01
`;

const EMOJIS_DERIVED_FROM_CJK_SYMBOLS = `
U+231A..U+231B
U+23E9..U+23EC
U+23F0
U+23F3
U+25FD..U+25FE
U+2614..U+2615
U+2648..U+2653
U+267F
U+2693
U+26A1
U+26AA..U+26AB
U+26BD..U+26BE
U+26C4..U+26C5
U+26CE
U+26D4
U+26EA
U+26F2..U+26F3
U+26F5
U+26FA
U+26FD
U+2705
U+270A..U+270B
U+2728
U+274C
U+274E
U+2753..U+2755
U+2757
U+2795..U+2797
U+27B0
U+27BF
U+2B1B..U+2B1C
U+2B50
U+2B55
U+1F004
U+1F21A
U+1F22F
U+1F30D..U+1F30F
U+1F315
U+1F31C
U+1F378
U+1F393
U+1F3A7
U+1F3AC..U+1F3AE
U+1F3C2
U+1F3C4
U+1F3C6
U+1F3CA
U+1F3E0
U+1F3ED
U+1F408
U+1F415
U+1F41F
U+1F426
U+1F442
U+1F446..U+1F449
U+1F44D..U+1F44E
U+1F453
U+1F46A
U+1F47D
U+1F4A3
U+1F4B0
U+1F4B3
U+1F4BB
U+1F4BF
U+1F4CB
U+1F4DA
U+1F4DF
U+1F4E4..U+1F4E6
U+1F4EA..U+1F4ED
U+1F4F7
U+1F4F9..U+1F4FB
U+1F508
U+1F50D
U+1F512..U+1F513
U+1F550..U+1F567
U+1F610
U+1F687
U+1F68D
U+1F691
U+1F694
U+1F698
U+1F6AD
U+1F6B2
U+1F6B9..U+1F6BA
U+1F6BC
`;

const LAST_CODE_POINT = 0x10ffff;

const codePoint = (written: string): number =>
  Number.parseInt(written.replace(`U+`, ``), 16);

// Each listed code point, as a set: `U+1100..U+11FF` lines and `U+20A9` lines.
const listed = (list: string): Set<number> => {
  const found = new Set<number>();
  for (const line of list.trim().split(`\n`)) {
    const [first = ``, last = first] = line.split(`..`);
    for (let cp = codePoint(first); cp <= codePoint(last); cp++) {
      found.add(cp);
    }
  }
  return found;
};

// Every code point where `answer` disagrees with the list.
const disagreements = (
  list: string,
  answer: (cp: number) => boolean
): number[] => {
  const expected = listed(list);
  const found: number[] = [];
  for (let cp = 0; cp <= LAST_CODE_POINT; cp++) {
    if (answer(cp) !== expected.has(cp)) {
      found.push(cp);
    }
  }
  return found;
};

// U+2FFFE and U+2FFFF are noncharacters, which EastAsianWidth.txt leaves N. ranges.md says so and puts them in anyway, "to simplify the ranges", since the specification does not care how noncharacters are read. The tables follow the data file.
const NONCHARACTERS_MERGED_BY_RANGES_MD = [0x2fffe, 0x2ffff];

describe("core: CJK tables against the specification's ranges.md", () => {
  it("are computed from Unicode 18, the version ranges.md is computed from", () => {
    // Raising the version means refreshing these lists from the ranges.md of the new version.
    expect(UNICODE_VERSION).toBe(`18.0.0`);
  });

  it("call exactly the listed code points CJK characters", () => {
    expect(disagreements(CJK_CHARACTERS, isCjkCharacter)).toEqual(
      NONCHARACTERS_MERGED_BY_RANGES_MD
    );
  });

  it("call exactly the listed code points non-emoji variation selectors", () => {
    expect(
      disagreements(NON_EMOJI_VARIATION_SELECTORS, isNonEmojiVariationSelector)
    ).toEqual([]);
  });

  it("read every code point of the ideograph blocks and of planes 2 and 3 as wide, assigned or not, so ideographs added after Unicode 18 are CJK characters already", () => {
    const narrow = [...listed(WIDE_IF_UNASSIGNED)].filter(
      (cp) => !isEastAsianWide(cp) || !isCjkCharacter(cp)
    );
    expect(narrow).toEqual(NONCHARACTERS_MERGED_BY_RANGES_MD);
  });

  it("know exactly the listed CJK ambiguous punctuation sequences", () => {
    const found: string[] = [];
    for (let cp = 0; cp <= LAST_CODE_POINT; cp++) {
      for (let selector = 0xfe00; selector <= 0xfe0f; selector++) {
        if (isCjkAmbiguousPunctuationSequence(cp, selector)) {
          found.push(
            [cp, selector]
              .map((point) => `U+${point.toString(16).toUpperCase()}`)
              .join(` `)
          );
        }
      }
    }
    expect(found).toEqual(
      CJK_AMBIGUOUS_PUNCTUATION_SEQUENCES.trim().split(`\n`)
    );
  });

  it("read the listed emoji as wide but not CJK, even those that began as CJK symbols", () => {
    // These show as emoji by default. The specification treats them as emoji even when U+FE0E asks for text, and keeps the question open for later.
    const misread = [...listed(EMOJIS_DERIVED_FROM_CJK_SYMBOLS)].filter(
      (cp) => !isEastAsianWide(cp) || isCjkCharacter(cp)
    );
    expect(misread).toEqual([]);
  });
});
