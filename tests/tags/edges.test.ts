import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { scanTags, type TagsOptions } from "../../packages/core/src";
import { tags } from "../../packages/mdit-tags/src";
import { remarkTags } from "../../packages/remd-tags/src";
import { satteriTags } from "../../packages/sat-tags/src";
import { normalizeHtml } from "../utils/index.js";

const features = { gfm: false, frontmatter: false, smartPunctuation: false };

// Each engine's raw output, before `normalizeHtml`, so a byte the engines print differently shows.
const raw = {
  mdit: (input: string, options?: TagsOptions): string =>
    new MarkdownIt().use(tags, options).render(input),
  remd: (input: string, options?: TagsOptions): string =>
    String(
      unified()
        .use(remarkParse)
        .use(remarkTags, options)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(input)
    ),
  sat: (input: string, options?: TagsOptions): string =>
    markdownToHtml(input, {
      features,
      mdastPlugins: [satteriTags(options)]
    }).html
};

const engines = [
  [`markdown-it`, raw.mdit],
  [`remark`, raw.remd],
  [`sätteri`, raw.sat]
] as const;

// Documents arrive with Windows line endings and with a lone carriage return; either is a line ending a tag can follow, as a line feed is.
describe("tags: any line ending is whitespace before a tag", () => {
  it.each(engines)("%s", (_engine, render) => {
    expect(
      normalizeHtml(render(`#one\r\n#two\r\n\r\n> #q\r\n> #r\r#s\r\n`))
    ).toBe(
      `<p><a class="tag" href="#one">#one</a><a class="tag" href="#two">#two</a></p><blockquote><p><a class="tag" href="#q">#q</a><a class="tag" href="#r">#r</a><a class="tag" href="#s">#s</a></p></blockquote>`
    );
  });
});

// Invisible characters, so they are written here as escapes rather than in the shared fixture. Obsidian ends a tag at each: the zero-width joiner and the zero-width space are General Punctuation, the non-breaking and the ideographic space are whitespace. Ending at the joiner splits an emoji sequence (the shared fixture has a family emoji), as Obsidian does, so a site's tags match the vault's.
describe("tags: a zero-width joiner or space, a non-breaking space and an ideographic space end a tag", () => {
  it.each(engines)("%s", (_engine, render) => {
    expect(
      normalizeHtml(render(`#a\u200db #a\u200bb #a\u00a0b #a\u3000b`))
    ).toBe(
      `<p><a class="tag" href="#a">#a</a>\u200db <a class="tag" href="#a">#a</a>\u200bb <a class="tag" href="#a">#a</a>\u00a0b <a class="tag" href="#a">#a</a>\u3000b</p>`
    );
  });
});

// The default link target is the name as written, with nothing encoded: a `/` and a character outside ASCII come out byte for byte the same in every engine. (remark-rehype would percent-encode a link node's `url`, which is why the mdast plugins build a node of their own.)
describe("tags: the default href is the name as written", () => {
  it.each(engines)("%s", (_engine, render) => {
    expect(render(`#inbox/日本語 #Café`)).toContain(
      `<a class="tag" href="#inbox/日本語">#inbox/日本語</a> <a class="tag" href="#Café">#Café</a>`
    );
  });
});

describe("tags: the href option", () => {
  // A site with a page per tag links there. The function is given the name without its `#`, and the text keeps the tag as written.
  it.each(engines)(
    "%s: maps a tag's name to its link target",
    (_engine, render) => {
      expect(
        normalizeHtml(
          render(`See #Inbox/To-Read`, {
            href: (name) => `/tags/${name.toLowerCase()}`
          })
        )
      ).toBe(
        `<p>See <a class="tag" href="/tags/inbox/to-read">#Inbox/To-Read</a></p>`
      );
    }
  );

  // `$&` and `$$` are replacement patterns to `String#replace`; the target must go into the output as the function returned it.
  it.each(engines)(
    "%s: takes a target holding $& and $$ as written",
    (_engine, render) => {
      expect(
        normalizeHtml(render(`#x`, { href: (name) => `/t/$&/$$/${name}` }))
      ).toBe(`<p><a class="tag" href="/t/$&amp;/$$/x">#x</a></p>`);
    }
  );

  // The target is an attribute value: whatever the function returns, it can't end the attribute or the tag.
  it.each(engines)(
    "%s: escapes the target in the attribute",
    (_engine, render) => {
      expect(
        normalizeHtml(render(`#x`, { href: (name) => `/s?q=${name}&a="b"` }))
      ).toBe(`<p><a class="tag" href="/s?q=x&amp;a=&quot;b&quot;">#x</a></p>`);
    }
  );
});

// Raw HTML is the author's markup, not text: an HTML block is never read, and a `#` straight after an inline tag is text, as after any other inline element. Text between two inline tags is ordinary text. Each engine is set to pass raw HTML through.
describe("tags: raw HTML", () => {
  const withHtml = [
    [
      `markdown-it`,
      (input: string) => new MarkdownIt({ html: true }).use(tags).render(input)
    ],
    [
      `remark`,
      (input: string) =>
        String(
          unified()
            .use(remarkParse)
            .use(remarkTags)
            .use(remarkRehype, { allowDangerousHtml: true })
            .use(rehypeStringify, { allowDangerousHtml: true })
            .processSync(input)
        )
    ],
    [
      `sätteri`,
      (input: string) =>
        markdownToHtml(input, { features, mdastPlugins: [satteriTags()] }).html
    ]
  ] as const;

  it.each(withHtml)("%s: never reads an HTML block", (_engine, render) => {
    expect(normalizeHtml(render(`<div>\n#notread\n</div>\n\n#read`))).toBe(
      `<div>\n#notread\n</div><p><a class="tag" href="#read">#read</a></p>`
    );
  });

  it.each(withHtml)(
    "%s: reads a paragraph inside an HTML block's tags",
    (_engine, render) => {
      expect(normalizeHtml(render(`<div>\n\n#read\n\n</div>`))).toBe(
        `<div><p><a class="tag" href="#read">#read</a></p></div>`
      );
    }
  );

  it.each(withHtml)(
    "%s: a hash straight after inline HTML is text",
    (_engine, render) => {
      expect(normalizeHtml(render(`<span>#x</span> a<br>#y <b> #z</b>`))).toBe(
        `<p><span>#x</span> a<br>#y <b> <a class="tag" href="#z">#z</a></b></p>`
      );
    }
  );
});

// Without GFM or linkify a bare URL is text, and its fragment follows a `/`, so it is never a tag either. Only a real autolink is skipped as a link: `<` and a space don't make one, and a tag after the space is read. These are not in the shared fixture, which the presets' suite renders with GFM on in remark and Sätteri and without linkify in markdown-it.
describe("tags: a URL without GFM", () => {
  it.each(engines)(
    "%s: a fragment of a bare URL is text",
    (_engine, render) => {
      expect(normalizeHtml(render(`https://example.com/#fragment`))).toBe(
        `<p>https://example.com/#fragment</p>`
      );
    }
  );

  it.each(engines)(
    "%s: a tag in brackets that are not an autolink",
    (_engine, render) => {
      expect(normalizeHtml(render(`<https://example.com/ #x>`))).toBe(
        `<p>&lt;https://example.com/ <a class="tag" href="#x">#x</a>></p>`
      );
    }
  );
});

// markdown-it has no footnotes, so this is remark and Sätteri with GFM on. A footnote reference is a link to its note, and its label is never read; the note's own text is.
describe("tags: a footnote reference is never read", () => {
  const input = `Text[^#x] #tag\n\n[^#x]: The note #in`;
  const footnotes = [
    [
      `remark`,
      (source: string) =>
        String(
          unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkTags)
            .use(remarkRehype)
            .use(rehypeStringify)
            .processSync(source)
        )
    ],
    [
      `sätteri`,
      (source: string) =>
        markdownToHtml(source, {
          features: { ...features, gfm: true },
          mdastPlugins: [satteriTags()]
        }).html
    ]
  ] as const;

  it.each(footnotes)("%s", (_engine, render) => {
    const html = render(input);
    expect(html.match(/class="tag"/g)).toEqual([`class="tag"`, `class="tag"`]);
    expect(html).toContain(`<a class="tag" href="#tag">#tag</a>`);
    expect(html).toContain(`<a class="tag" href="#in">#in</a>`);
  });
});

// Untrusted input must not make the scan restart at every character of a long run. Each of these takes a few tens of milliseconds; the bound leaves a slow runner a wide margin and still catches quadratic work, which takes minutes at this length.
describe("tags: a long run is read in time proportional to its length", () => {
  const inputs = [
    [`50,000 hashes in a row`, `#`.repeat(50_000)],
    [`a hash and 50,000 letters`, `#${`a`.repeat(50_000)}`],
    [`50,000 spaces before a hash`, `x${` `.repeat(50_000)}#a`],
    [`a hash and 50,000 digits`, `#${`1`.repeat(50_000)}`],
    // Each one a new entry in the document's list of tags.
    [
      `10,000 different tags`,
      Array.from({ length: 10_000 }, (_, i) => `#t${i}`).join(` `)
    ]
  ] as const;

  describe.each(engines)("%s", (_engine, render) => {
    it.each(inputs)("%s", (_name, input) => {
      const started = performance.now();
      render(input);
      expect(performance.now() - started).toBeLessThan(1000);
    });
  });

  it.each(inputs)("the shared scan: %s", (_name, input) => {
    const started = performance.now();
    scanTags(input, new Set(), true);
    expect(performance.now() - started).toBeLessThan(250);
  });

  // markdown-it gives each character reference and each escape a token of its own, so one paragraph can be a run of thousands of tokens holding thousands of tags. Splitting that run has to walk it once, not once per tag: it took 2.6 seconds here when it did.
  it.each([
    [`character references`, `&amp; #a `],
    [`escapes`, `\\* #a `]
  ])("markdown-it: 10,000 tags among %s", (_name, unit) => {
    const input = unit.repeat(10_000);
    const started = performance.now();
    const html = raw.mdit(input);
    expect(performance.now() - started).toBeLessThan(1000);
    expect(html.split(`<a class="tag" href="#a">#a</a>`)).toHaveLength(10_001);
  });
});

// Smart punctuation rewrites `--` into a dash. markdown-it finds tags before its typographer runs, so the tag keeps `--` in its link and shows the dash in its text. Sätteri rewrites while parsing, before any plugin, and the dash (punctuation outside ASCII) ends the tag; remark with remark-smartypants ahead of it does the same. The guide says to turn smart punctuation off, as the presets do; this pins the difference so it can't drift unnoticed.
describe("tags: smart punctuation (engines differ)", () => {
  const input = `#a--b #bob's`;

  it("markdown-it: the tag is found before the typographer rewrites its text", () => {
    expect(
      normalizeHtml(
        new MarkdownIt({ typographer: true }).use(tags).render(input)
      )
    ).toBe(
      `<p><a class="tag" href="#a--b">#a–b</a> <a class="tag" href="#bob">#bob</a>’s</p>`
    );
  });

  it("sätteri: the dash the parser wrote ends the tag", () => {
    expect(
      normalizeHtml(
        markdownToHtml(input, {
          features: { ...features, smartPunctuation: true },
          mdastPlugins: [satteriTags()]
        }).html
      )
    ).toBe(
      `<p><a class="tag" href="#a">#a</a>–b <a class="tag" href="#bob">#bob</a>’s</p>`
    );
  });
});

// remark resolves escapes before plugins run, so the plugin reads them from the file: a tree transformed on its own (`runSync(tree)`) has no source to tell `\#tag` from `#tag`. The guide says so, as the mark and kbd guides do.
describe("remd-tags: escapes are read from the file", () => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkTags)
    .use(remarkRehype)
    .use(rehypeStringify);

  it("keeps an escaped hash as text when the file is there", () => {
    expect(String(processor.processSync(`\\#tag #real`))).toBe(
      `<p>#tag <a class="tag" href="#real">#real</a></p>`
    );
  });

  it("reads an escaped hash as a tag when the tree is transformed without its file", () => {
    const tree = processor.runSync(processor.parse(`\\#tag #real`));
    expect(processor.stringify(tree)).toBe(
      `<p><a class="tag" href="#tag">#tag</a> <a class="tag" href="#real">#real</a></p>`
    );
  });
});
