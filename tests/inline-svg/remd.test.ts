import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeInlineSvg } from "@saeris/remd-inline-svg";

const process = async (markdown: string) => {
  const compiler = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeInlineSvg)
    .use(rehypeStringify);

  const file = await compiler.process({
    value: markdown,
    path: fileURLToPath(import.meta.url),
  });

  return String(file);
};

test("inline-svg (rehype): inlines svg", async () => {
  expect(await process(`![](./fixtures/circle.inline.svg)`)).toMatchSnapshot();
});

test("inline-svg (rehype): preserves alt text as attribute", async () => {
  expect(await process(`![Inline SVG](./fixtures/circle.inline.svg)`)).toMatchSnapshot();
});

test("inline-svg (rehype): utf-8 file path", async () => {
  expect(await process(`![一](./fixtures/一.svg)`)).toMatchSnapshot();
});

test("inline-svg (rehype): leaves non-svg images unchanged", async () => {
  const result = await process(`![](./fixtures/circle.inline.svg)\n\n![logo](./fixtures/logo.png)`);
  expect(result).toMatchSnapshot();
});

test("inline-svg (rehype): typical document", async () => {
  const input = [
    `# Hello`,
    ``,
    `This is a test markdown document.`,
    ``,
    `![Inline SVG](./fixtures/circle.inline.svg)`,
    ``,
    `Cheers`,
  ].join("\n");
  expect(await process(input)).toMatchSnapshot();
});

test("inline-svg (rehype): cacheEfficiency callback", async () => {
  const hits: number[] = [];
  const misses: number[] = [];

  const compiler = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeInlineSvg, {
      cacheEfficiency: (data) => {
        hits.push(data.hits);
        misses.push(data.misses);
      },
    })
    .use(rehypeStringify);

  await compiler.process({
    value: `![](./fixtures/circle.inline.svg)`,
    path: fileURLToPath(import.meta.url),
  });

  expect(hits).toStrictEqual([0]);
  expect(misses).toStrictEqual([1]);
});
