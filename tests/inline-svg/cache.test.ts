import { mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { inlineSvg } from "../../packages/mdit-inline-svg/src";
import {
  rehypeInlineSvg,
  type CacheEfficiency
} from "../../packages/remd-inline-svg/src";
import { satteriInlineSvg } from "../../packages/sat-inline-svg/src";

// A plugin keeps each SVG it has read, so a build reads a file once however many pages show it. A dev server keeps the same plugin for hours while the files are edited: a cache that never looks at the file again serves the icon as it was when the server started, until a restart.

const directory = mkdtempSync(join(tmpdir(), `inline-svg-cache-`));
afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

const svg = (fill: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="${fill}"/></svg>`;

// Each engine renders `![icon](./icon.svg)` from a document in a directory of its own, with one plugin for all its renders, and reports the cache's counts after each.
const engines = [
  {
    engine: `markdown-it`,
    create: (document: string) => {
      const counts: CacheEfficiency[] = [];
      const md = new MarkdownIt().use(inlineSvg, {
        cacheEfficiency: (count) => counts.push(count)
      });
      const env = { currentDocument: pathToFileURL(document).href };
      return {
        counts,
        render: (): Promise<string> =>
          Promise.resolve(md.render(`![icon](./icon.svg)`, env))
      };
    }
  },
  {
    engine: `rehype`,
    create: (document: string) => {
      const counts: CacheEfficiency[] = [];
      const processor = unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeInlineSvg, {
          cacheEfficiency: (count) => counts.push(count)
        })
        .use(rehypeStringify, { allowDangerousHtml: true });
      return {
        counts,
        render: async (): Promise<string> =>
          String(
            await processor.process({
              value: `![icon](./icon.svg)`,
              path: document
            })
          )
      };
    }
  },
  {
    engine: `Sätteri`,
    create: (document: string) => {
      const counts: CacheEfficiency[] = [];
      const plugin = satteriInlineSvg({
        cacheEfficiency: (count) => counts.push(count)
      });
      return {
        counts,
        render: (): Promise<string> =>
          Promise.resolve(
            markdownToHtml(`![icon](./icon.svg)`, {
              hastPlugins: [plugin],
              fileURL: pathToFileURL(document)
            }).html
          )
      };
    }
  }
];

describe.each(engines)("inline-svg cache ($engine)", ({ engine, create }) => {
  const folder = mkdtempSync(join(directory, `${engine}-`));
  const icon = join(folder, `icon.svg`);
  const document = join(folder, `page.md`);
  // The modification time is set by hand, a minute apart, so the test doesn't depend on the clock's or the file system's resolution.
  const write = (fill: string, minutes: number): void => {
    writeFileSync(icon, svg(fill));
    const time = new Date(Date.UTC(2026, 0, 1, 0, minutes));
    utimesSync(icon, time, time);
  };

  it("renders a file as it is now, not as it was when the plugin first read it", async () => {
    const { render } = create(document);
    write(`red`, 0);
    expect(await render()).toContain(`fill="red"`);
    write(`green`, 1);
    const edited = await render();
    expect(edited).toContain(`fill="green"`);
    expect(edited).not.toContain(`fill="red"`);
  });

  // The point of the cache: a file that hasn't changed is read and optimized once, and a changed one once more.
  it("reads a file again only when it has changed", async () => {
    const { counts, render } = create(document);
    write(`red`, 2);
    await render();
    await render();
    write(`blue`, 3);
    await render();
    await render();
    expect(counts.at(-1)).toEqual({ hits: 2, misses: 2 });
  });

  // An edit that leaves the time as it was (a file restored by a tool that keeps times) but not the length is still an edit.
  it("notices a file whose length changed though its time didn't", async () => {
    const { render } = create(document);
    write(`red`, 4);
    expect(await render()).toContain(`fill="red"`);
    write(`green`, 4);
    expect(await render()).toContain(`fill="green"`);
  });
});
