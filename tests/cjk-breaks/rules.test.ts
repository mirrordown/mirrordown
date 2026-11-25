import { describe, expect, it } from "vite-plus/test";
import { engines } from "./engines.js";

// The behaviour the set exists for, compared as each engine writes it: the fixtures go through `normalizeHtml`, which drops a line break between two tags, so a break between `</strong>` and `<strong>` (or left behind by a code span) is only seen here.
const rows: readonly { why: string; input: string; html: string }[] = [
  {
    why: `a break inside a Japanese sentence would show as a space`,
    input: `日本語の文章は\n改行しても`,
    html: `<p>日本語の文章は改行しても</p>`
  },
  {
    why: `a break between Japanese and English is a word space`,
    input: `日本語\nEnglish`,
    html: `<p>日本語\nEnglish</p>`
  },
  {
    why: `a break between English and Japanese is a word space`,
    input: `English\n日本語`,
    html: `<p>English\n日本語</p>`
  },
  {
    why: `Korean puts spaces between words`,
    input: `한국어 문장은\n띄어쓰기를`,
    html: `<p>한국어 문장은\n띄어쓰기를</p>`
  },
  {
    why: `fullwidth punctuation is wide`,
    input: `中文，\n标点`,
    html: `<p>中文，标点</p>`
  },
  {
    why: `a hard break is the author's`,
    input: `日本語  \n日本語`,
    html: `<p>日本語<br>\n日本語</p>`
  },
  {
    why: `the characters the reader sees are inside the emphasis`,
    input: `**日本**\n**語**`,
    html: `<p><strong>日本</strong><strong>語</strong></p>`
  },
  {
    why: `a zero-width space already marks where the line may wrap`,
    input: `English​\nEnglish`,
    html: `<p>English​English</p>`
  },
  {
    why: `a code span shows its own characters`,
    input: "`コード`\n日本語",
    html: `<p><code>コード</code>日本語</p>`
  },
  {
    why: `the character before the break is the code span's last`,
    input: "日本語`foo`\n日本語",
    html: `<p>日本語<code>foo</code>\n日本語</p>`
  },
  {
    why: `an image is not a character`,
    input: `日本語![](x)\n日本語`,
    html: `<p>日本語<img src="x" alt="">\n日本語</p>`
  },
  {
    why: `a wide emoji is wide: the rule reads East Asian Width alone`,
    input: `🎉\n日本語`,
    html: `<p>🎉日本語</p>`
  },
  {
    why: `a line that held only the break leaves nothing behind`,
    input: "`コード`\n**日本**",
    html: `<p><code>コード</code><strong>日本</strong></p>`
  },
  {
    why: `a break between two links`,
    input: `[日本](a)\n[語](b)`,
    html: `<p><a href="a">日本</a><a href="b">語</a></p>`
  }
];

describe.each(engines)(`cjk-breaks in %s`, (_, render) => {
  it.each(rows)(`$why`, ({ input, html }) => {
    expect(render(input).trimEnd()).toBe(html);
  });
});
