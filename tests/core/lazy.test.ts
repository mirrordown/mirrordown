import { describe, expect, it } from "vite-plus/test";
import type { Paragraph } from "mdast";
import { paraToLines } from "../../packages/core/src/lazy";

// The steps, tabs and caption recognition all cut paragraphs into lines with this, so what it leaves on a line ends up in titles, labels and rebuilt paragraphs in remark and Sätteri alike.
describe("paraToLines", () => {
  const lineValues = (value: string): string[] => {
    const para: Paragraph = {
      type: "paragraph",
      children: [{ type: "text", value }]
    };
    return paraToLines(para).map((line) =>
      line.map((node) => (node.type === "text" ? node.value : "")).join("")
    );
  };

  // Parsers keep a document's own line endings in text values; markdown-it normalizes them, so a `\r` left on a line would make the engines differ.
  it.each([
    ["LF", "one\ntwo\nthree"],
    ["CRLF", "one\r\ntwo\r\nthree"],
    ["a lone CR", "one\rtwo\rthree"]
  ])("splits at %s line endings, leaving none on a line", (_, value) => {
    expect(lineValues(value)).toEqual(["one", "two", "three"]);
  });
});
