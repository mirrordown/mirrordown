import { describe, expect, it } from "vite-plus/test";
import {
  escapedIndices,
  maskEscaped,
  maskTreeEscapes,
  unmaskEscaped
} from "../../packages/core/src";

// A text node's value is what the parser left after resolving escapes, so the
// aligner has to find each value character's origin in the source to tell an
// escaped delimiter (`\==`) from a real one.
const escapedIn = (source: string, value: string): number[] => [
  ...escapedIndices(value, source, 0, source.length)
];

describe("core: escapedIndices", () => {
  it("marks a backslash-escaped delimiter character", () => {
    expect(escapedIn(String.raw`\==x==`, "==x==")).toEqual([0]);
  });

  it("does not mark a character after an escaped backslash", () => {
    // `\\` is a literal backslash, so the `=` after it is a real delimiter.
    expect(escapedIn(String.raw`\\==x==`, String.raw`\==x==`)).toEqual([]);
  });

  it("only marks ASCII punctuation, which is all a backslash can escape", () => {
    expect(escapedIn(String.raw`\a`, String.raw`\a`)).toEqual([]);
  });

  it("skips container prefixes the parser dropped from later lines", () => {
    // value of the paragraph inside `> a\n> \==b==`
    expect(
      escapedIn(String.raw`a` + "\n> " + String.raw`\==b==`, "a\n==b==")
    ).toEqual([2]);
  });

  it("treats a character reference as the character it decodes to", () => {
    expect(escapedIn(String.raw`&lt;\==x==`, "<==x==")).toEqual([1]);
  });
});

describe("core: masking", () => {
  it("round-trips masked text", () => {
    const masked = maskEscaped("==x==", new Set([0, 1]));
    expect(masked).not.toContain("==x");
    expect(unmaskEscaped(masked)).toBe("==x==");
  });

  it("masks positioned text nodes and restores every node afterwards", () => {
    const source = String.raw`\==x==`;
    const text = {
      type: "text",
      value: "==x==",
      position: { start: { offset: 0 }, end: { offset: source.length } }
    };
    const tree = {
      type: "root",
      children: [{ type: "paragraph", children: [text] }]
    };
    const restore = maskTreeEscapes(tree, source);
    expect(text.value).not.toMatch(/^==/);
    restore();
    expect(text.value).toBe("==x==");
  });
});
