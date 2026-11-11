import { describe, expect, it } from "vite-plus/test";
import {
  carryEscapes,
  escapedIndices,
  maskEscaped,
  maskTreeEscapes,
  textEscapes,
  unmaskEscaped
} from "../../packages/core/src";

// A text node's value is what the parser left after resolving escapes, so the
// aligner has to find each value character's origin in the source to tell an
// escaped delimiter (`\==`) from a real one.
const escapedIn = (source: string, value: string): number[] => [
  ...escapedIndices(value, source, 0, source.length)
];

interface TextNode {
  type: string;
  value: string;
  data?: object;
  position?: { start: { offset: number }; end: { offset: number } };
}

describe("core: escapedIndices", () => {
  it("marks a backslash-escaped delimiter character", () => {
    expect(escapedIn(String.raw`\==x==`, "==x==")).toEqual([0]);
  });

  it("does not mark a character after an escaped backslash", () => {
    // `\\` is a literal backslash (itself the escaped character), so the `=` after it is a real delimiter.
    expect(escapedIn(String.raw`\\==x==`, String.raw`\==x==`)).toEqual([0]);
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

  it("marks a character written as a reference, which markdown-it never reads as a delimiter", () => {
    expect(escapedIn("&#61;=x==", "==x==")).toEqual([0]);
    expect(escapedIn(String.raw`&lt;\==x==`, "<==x==")).toEqual([0, 1]);
  });

  it("lets a reference the parser kept as text match itself", () => {
    // `&T;` is no known reference and `\&` is an escaped ampersand, so the value still holds the reference's own characters.
    expect(escapedIn(String.raw`AT&T; \==x==`, "AT&T; ==x==")).toEqual([6]);
    expect(escapedIn(String.raw`\&#61;=x`, "&#61;=x")).toEqual([0]);
  });

  it("keeps its place after a reference that decodes to two UTF-16 units", () => {
    // Losing the alignment here dropped every later escape in the node.
    expect(escapedIn(String.raw`&#x1F600; \==a==`, "😀 ==a==")).toEqual([
      0, 1, 3
    ]);
  });

  it("keeps its place after a reference that decodes to two characters", () => {
    expect(escapedIn(String.raw`&NotEqualTilde; \==a==`, "≂̸ ==a==")).toEqual([
      0, 3
    ]);
  });

  it("picks up again after a character the source does not have", () => {
    // Smart punctuation and NUL replacement put characters in the value that the source lacks.
    expect(escapedIn(String.raw`"q" \==x==`, "“q” ==x==")).toEqual([4]);
    expect(escapedIn(String.raw`a -- b \==x==`, "a – b ==x==")).toEqual([6]);
    expect(escapedIn("a\u0000 " + String.raw`\==x==`, "a� ==x==")).toEqual([3]);
  });

  it("does not jump ahead to a later copy of a character the source lacks here", () => {
    // Smart punctuation curled the first apostrophe; the curly one typed further on must not pull the alignment past the escape.
    expect(
      escapedIn(String.raw`don't \==a== it’s`, "don’t ==a== it’s")
    ).toEqual([6]);
  });

  it("counts a run of backslashes once, not once per character after it", () => {
    // Re-counting the run for every character made a line of backslashes take seconds.
    const literal = "\\".repeat(100_000);
    const started = performance.now();
    // Every literal backslash is an escaped one; what matters is the `=` after the run.
    const afterRun = (source: string): number[] =>
      escapedIn(source, literal + "==x==").filter((i) => i >= literal.length);
    expect(afterRun("\\".repeat(200_000) + "==x==")).toEqual([]);
    expect(afterRun("\\".repeat(200_001) + "==x==")).toEqual([100_000]);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});

describe("core: masking", () => {
  it("round-trips masked text", () => {
    const masked = maskEscaped("==x==", new Set([0, 1]));
    expect(masked).not.toContain("==x");
    expect(unmaskEscaped(masked)).toBe("==x==");
  });

  it("gives back a Private Use character the author typed", () => {
    // The stand-ins are real code points (Nerd Fonts puts icons there), so unmasking must not turn the author's own into ASCII.
    const typed = "\u{F003C}b\u{F003E} ==x==";
    const masked = maskEscaped(typed, new Set([6]));
    expect(masked).not.toContain("==x");
    expect(unmaskEscaped(masked)).toBe(typed);
    expect(unmaskEscaped(maskEscaped(typed, new Set()))).toBe(typed);
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

  it("restores only text nodes, the only ones it masks", () => {
    // Code and raw HTML are never masked, so a Private Use character in them is the author's.
    const code = { type: "code", value: "\u{F003C}" };
    const inline = { type: "inlineCode", value: "\u{F0041}" };
    const text = { type: "text", value: "\u{F0042} ==x==" };
    const tree = {
      type: "root",
      children: [code, { type: "paragraph", children: [inline, text] }]
    };
    maskTreeEscapes(tree, "")();
    expect(code.value).toBe("\u{F003C}");
    expect(inline.value).toBe("\u{F0041}");
    expect(text.value).toBe("\u{F0042} ==x==");
  });

  it("masks the whole text of an autolink, which markdown-it emits as one literal token", () => {
    const source = "<http://x.y/==a==>";
    const text = {
      type: "text",
      value: "http://x.y/==a==",
      position: { start: { offset: 1 }, end: { offset: source.length - 1 } }
    };
    const restore = maskTreeEscapes({ type: "link", children: [text] }, source);
    expect(text.value).not.toContain("==");
    restore();
    expect(text.value).toBe("http://x.y/==a==");
  });

  it("records the escapes of text a scan rebuilt, for the next plugin's scan", () => {
    // A node a scan builds has no position to recover its escapes from; without the record, the next plugin reads `\==` as a real delimiter.
    const source = String.raw`--a-- \==b==`;
    const original: TextNode = {
      type: "text",
      value: "--a-- ==b==",
      position: { start: { offset: 0 }, end: { offset: source.length } }
    };
    const paragraph = { type: "paragraph", children: [original] };
    const restore = maskTreeEscapes(paragraph, source);
    // What a scan does: build a new text node from part of the masked value.
    const built: TextNode = { type: "text", value: original.value.slice(5) };
    paragraph.children = [built];
    restore();
    expect(built).toEqual({
      type: "text",
      value: " ==b==",
      data: { escaped: [1] }
    });

    const again = maskTreeEscapes(paragraph, source);
    expect(built.value).not.toContain("==b");
    again();
    expect(built.value).toBe(" ==b==");
  });

  it("carries a text node's escapes over to the pieces a plugin splits it into", () => {
    // Plugins that split text themselves (abbreviations, ruby) would otherwise drop the escapes, and a later span scan would read `\==` as a delimiter.
    const source = String.raw`HTML \==b==`;
    const node: TextNode = {
      type: "text",
      value: "HTML ==b==",
      position: { start: { offset: 0 }, end: { offset: source.length } }
    };
    const escaped = textEscapes(node, source);
    const term: TextNode = { type: "text", value: "HTML" };
    const rest: TextNode = { type: "text", value: " ==b==" };
    carryEscapes(term, escaped, 0);
    carryEscapes(rest, escaped, 4);
    expect(term).toEqual({ type: "text", value: "HTML" });
    expect(rest.data).toEqual({ escaped: [1] });
    expect([...textEscapes(rest, source)]).toEqual([1]);
  });

  it("cannot tell an escape without the source the tree was parsed from", () => {
    // `runSync(tree)` without the file gives the plugins an empty source, so an escaped delimiter is read as a real one. This is a documented requirement, not something the plugins can enforce.
    const text = {
      type: "text",
      value: "==x==",
      position: { start: { offset: 0 }, end: { offset: 6 } }
    };
    maskTreeEscapes({ type: "paragraph", children: [text] }, "");
    expect(text.value).toBe("==x==");
  });
});
