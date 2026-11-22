import { describe, expect, it } from "vite-plus/test";
import { engines } from "../presets/engines.js";
import { features } from "../presets/features.js";

// The presets with only the named features on, so each case runs the plugins it is about in the order the presets put them; alert icons are off to keep the HTML short.
const renderAll = (
  keys: readonly (typeof features)[number][`key`][]
): ((input: string) => string[]) => {
  const options = {
    ...Object.fromEntries(
      features
        .filter((feature) => !keys.includes(feature.key))
        .map((feature) => [feature.key, false])
    ),
    ...(keys.includes(`githubAlerts`) ? { githubAlerts: { icons: false } } : {})
  };
  const renderers = engines.map(([, make]) => make(options));
  return (input) => renderers.map((render) => render(input));
};

const three = (html: string): string[] => [html, html, html];

// Rule 7: an id the author wrote replaces a generated one, and a marker is one. The heading keeps the marker's id through slug, autolink-headings and sectionize, and slug doesn't count its text as used, so the next heading with the same text takes the first free slug.
describe("block-ids with slug, autolink-headings and sectionize", () => {
  const render = renderAll([
    `blockIds`,
    `slug`,
    `autolinkHeadings`,
    `sectionize`
  ]);

  it("keeps a named heading's id and leaves its slug free", () => {
    expect(render("## Same\n\n## Same ^x\n\n## Same")).toStrictEqual(
      three(
        '<section data-depth="2"><h2 id="same"><a class="anchor" aria-hidden="true" tabindex="-1" href="#same"></a>Same</h2></section><section data-depth="2"><h2 id="^x"><a class="anchor" aria-hidden="true" tabindex="-1" href="#^x"></a>Same</h2></section><section data-depth="2"><h2 id="same-1"><a class="anchor" aria-hidden="true" tabindex="-1" href="#same-1"></a>Same</h2></section>'
      )
    );
  });

  it("links a named heading's anchor to its id inside its section", () => {
    expect(render("# Title ^t\n\nText")).toStrictEqual(
      three(
        '<section data-depth="1"><h1 id="^t"><a class="anchor" aria-hidden="true" tabindex="-1" href="#^t"></a>Title</h1><p>Text</p></section>'
      )
    );
  });
});

// The outermost quote or alert is named, from its body, its title line, a lazy line after it, a list in it, or a paragraph alone after it; the id goes on the element the alert renders.
describe("block-ids with github-alerts", () => {
  const render = renderAll([`blockIds`, `githubAlerts`]);

  it.each([
    {
      name: "a marker in an alert's body names the alert",
      input: "> [!tip] Tip\n> Body ^b",
      expected:
        '<div class="markdown-alert" data-alert="tip" id="^b"><p class="markdown-alert-title" aria-label="Tip">Tip</p><p>Body</p></div>'
    },
    {
      name: "a marker ending the title line names the alert and leaves the title and its label",
      input: "> [!tip] Tip ^t\n>\n> Body",
      expected:
        '<div class="markdown-alert" data-alert="tip" id="^t"><p class="markdown-alert-title" aria-label="Tip">Tip</p><p>Body</p></div>'
    },
    {
      name: "a title that was only a marker is the type's own",
      input: "> [!note] ^blk",
      expected:
        '<div class="markdown-alert" data-alert="note" id="^blk"><p class="markdown-alert-title" aria-label="Note">Note</p></div>'
    },
    {
      name: "a marker on the title line with the body on the next line is text, as the title line does not end its paragraph",
      input: "> [!tip] Tip ^t\n> Body",
      expected:
        '<div class="markdown-alert" data-alert="tip"><p class="markdown-alert-title" aria-label="Tip ^t">Tip ^t</p><p>Body</p></div>'
    },
    {
      name: "a marker straight after the type is text",
      input: "> [!tip]^no",
      expected:
        '<div class="markdown-alert" data-alert="tip"><p class="markdown-alert-title" aria-label="^no">^no</p></div>'
    },
    {
      name: "a marker on a lazy line after the alert names it",
      input: "> [!tip] Tip\n> Body\n^my-callout",
      expected:
        '<div class="markdown-alert" data-alert="tip" id="^my-callout"><p class="markdown-alert-title" aria-label="Tip">Tip</p><p>Body</p></div>'
    },
    {
      name: "a marker alone after the alert names it",
      input: "> [!tip] Tip\n> Body\n\n^after",
      expected:
        '<div class="markdown-alert" data-alert="tip" id="^after"><p class="markdown-alert-title" aria-label="Tip">Tip</p><p>Body</p></div>'
    },
    {
      name: "a marker in a foldable alert names its details",
      input: "> [!note]- Fold\n> Body ^f",
      expected:
        '<details class="markdown-alert" data-alert="note" id="^f"><summary class="markdown-alert-title" aria-label="Fold">Fold</summary><p>Body</p></details>'
    },
    {
      name: "a marker on an open foldable alert's title names it",
      input: "> [!note]+ Open ^o",
      expected:
        '<details class="markdown-alert" data-alert="note" open id="^o"><summary class="markdown-alert-title" aria-label="Open">Open</summary></details>'
    },
    {
      name: "a marker in a nested alert names the outermost",
      input: "> [!note]\n> > [!tip] Inner ^x",
      expected:
        '<div class="markdown-alert" data-alert="note" id="^x"><p class="markdown-alert-title" aria-label="Note">Note</p><div class="markdown-alert" data-alert="tip"><p class="markdown-alert-title" aria-label="Inner">Inner</p></div></div>'
    },
    {
      name: "the items' markers in an alert name it, the last one winning",
      input: "> [!note]\n> - a ^one\n> - b ^two",
      expected:
        '<div class="markdown-alert" data-alert="note" id="^two"><p class="markdown-alert-title" aria-label="Note">Note</p><ul><li>a</li><li>b</li></ul></div>'
    }
  ])("$name", ({ input, expected }) => {
    expect(render(input)).toStrictEqual(three(expected));
  });
});

// A title that was only a marker is the type's own title, and a site that translated its titles gets its translation. Each engine finds it differently: markdown-it's title keeps it (`meta.githubAlertTitle`), remark's alert leaves it on the title node (`data.defaultTitle`) because block-ids runs after the alert is built there, and Sätteri's block-ids runs before github-alerts, which then titles the alert itself.
describe("block-ids with github-alerts' titles option", () => {
  const [mdit, remark, satteri] = engines.map(([, make]) =>
    make({
      ...Object.fromEntries(
        features
          .filter(
            (feature) => ![`blockIds`, `githubAlerts`].includes(feature.key)
          )
          .map((feature) => [feature.key, false])
      ),
      githubAlerts: { icons: false, titles: { note: `Hinweis` } }
    })
  );

  it("keeps a custom title when the title was only a marker", () => {
    const input = "> [!note] ^blk";
    const titled =
      '<div class="markdown-alert" data-alert="note" id="^blk"><p class="markdown-alert-title" aria-label="Hinweis">Hinweis</p></div>';
    expect(mdit(input)).toBe(titled);
    expect(remark(input)).toBe(titled);
    expect(satteri(input)).toBe(titled);
  });
});

// A tab panel or a step is written with `>` but is not a quote: a marker in one names its own paragraph or item, and a real quote inside is named as a quote. A marker alone after the container names the container.
describe("block-ids with tabs and steps", () => {
  const render = renderAll([`blockIds`, `tabs`, `steps`]);
  const tab = (panel: string, group = ``): string =>
    `<div class="markdown-tabs" data-tabs-group="2b606"${group}><div class="markdown-tabs-labels"><input type="radio" name="tabs-fdb5a87f" id="tabs-fdb5a87f-0" hidden checked><label class="markdown-tabs-label" for="tabs-fdb5a87f-0">A</label></div><div class="markdown-tabs-panels"><section class="markdown-tabs-panel" aria-label="A">${panel}</section></div></div>`;

  it.each([
    {
      name: "a marker in a panel names its paragraph",
      input: "% A\n> body ^x",
      expected: tab('<p id="^x">body</p>')
    },
    {
      name: "a marker in a list item in a panel names the item",
      input: "% A\n> - item ^li",
      expected: tab('<ul><li id="^li">item</li></ul>')
    },
    {
      name: "a quote in a panel is named as a quote",
      input: "% A\n> > quoted ^q",
      expected: tab('<blockquote id="^q"><p>quoted</p></blockquote>')
    },
    {
      name: "a marker alone in a panel names the block before it there",
      input: "% A\n> para\n>\n> ^own",
      expected: tab('<p id="^own">para</p>')
    },
    {
      name: "a marker alone first in a panel names nothing",
      input: "% A\n>\n> ^first",
      expected: tab(``)
    },
    {
      name: "a quote around a tab group is not named from inside a panel",
      input: "> % A\n> > body ^x",
      expected: `<blockquote>${tab('<p id="^x">body</p>')}</blockquote>`
    },
    {
      name: "a marker alone after a tab group names the group",
      input: "% A\n> body\n\n^tabs",
      expected: tab("<p>body</p>", ' id="^tabs"')
    },
    {
      name: "a marker in a step's body names its paragraph",
      input: "@1. Step\n>  body ^s",
      expected:
        '<ol class="markdown-steps"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">Step</p><div class="markdown-steps-body"><p id="^s">body</p></div></li></ol>'
    },
    {
      name: "a marker on a step's title is text, as a title is not a paragraph",
      input: "@1. Step ^title\n>  body",
      expected:
        '<ol class="markdown-steps"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">Step ^title</p><div class="markdown-steps-body"><p>body</p></div></li></ol>'
    },
    {
      name: "a marker alone after steps names the list of steps",
      input: "@1. Step\n>  body\n\n^steps",
      expected:
        '<ol class="markdown-steps" id="^steps"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">Step</p><div class="markdown-steps-body"><p>body</p></div></li></ol>'
    }
  ])("$name", ({ input, expected }) => {
    expect(render(input)).toStrictEqual(three(expected));
  });
});

// A tab or step header lazily continues the body's last paragraph in CommonMark, so Sätteri, which reads attribute blocks while it parses, finds that paragraph's block mid-paragraph; tabs and steps cut the header off and place the block (`placeCutAttributes`) before block-ids reads the paragraph. Its marker then ends the paragraph, as in the engines whose attrs run after recognition.
describe("block-ids with tabs, steps and attrs", () => {
  const render = renderAll([`blockIds`, `tabs`, `steps`, `attrs`]);

  it("names a paragraph whose attribute block a tab header cut off", () => {
    expect(render("% A\n> body ^m\n> {.c}\n% B\n> more")).toStrictEqual(
      three(
        '<div class="markdown-tabs" data-tabs-group="b8855b5"><div class="markdown-tabs-labels"><input type="radio" name="tabs-4edb7582" id="tabs-4edb7582-0" hidden checked><label class="markdown-tabs-label" for="tabs-4edb7582-0">A</label><input type="radio" name="tabs-4edb7582" id="tabs-4edb7582-1" hidden><label class="markdown-tabs-label" for="tabs-4edb7582-1">B</label></div><div class="markdown-tabs-panels"><section class="markdown-tabs-panel" aria-label="A"><p class="c" id="^m">body</p></section><section class="markdown-tabs-panel" aria-label="B"><p>more</p></section></div></div>'
      )
    );
  });

  it("names a step's paragraph whose attribute block a step header cut off", () => {
    expect(render("@1. One\n>  body ^m {.c}\n@1. Two\n>  b")).toStrictEqual(
      three(
        '<ol class="markdown-steps"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">One</p><div class="markdown-steps-body"><p class="c" id="^m">body</p></div></li><li class="markdown-steps-item" data-step="2"><p class="markdown-steps-title">Two</p><div class="markdown-steps-body"><p>b</p></div></li></ol>'
      )
    );
  });
});

// A definition's paragraph names its description, as a list item's names the item: a tight definition renders no `<p>` to carry it. A term is not a paragraph.
describe("block-ids with definition-list", () => {
  const render = renderAll([`blockIds`, `definitionList`]);

  it.each([
    {
      name: "a marker in a definition names the description",
      input: "Term\n: Definition ^d",
      expected: '<dl><dt>Term</dt><dd id="^d">Definition</dd></dl>'
    },
    {
      name: "a marker in a loose definition's last paragraph names the description",
      input: "Term\n: Definition\n\n  more ^loose",
      expected:
        '<dl><dt>Term</dt><dd id="^loose"><p>Definition</p><p>more</p></dd></dl>'
    },
    {
      name: "a marker on a term is text",
      input: "Term ^t\n: Definition",
      expected: "<dl><dt>Term ^t</dt><dd>Definition</dd></dl>"
    },
    {
      name: "a marker alone after a definition list names the list",
      input: "Term\n: Definition\n\n^dl",
      expected: '<dl id="^dl"><dt>Term</dt><dd>Definition</dd></dl>'
    }
  ])("$name", ({ input, expected }) => {
    expect(render(input)).toStrictEqual(three(expected));
  });
});

// Block ids run before caption: a caption line is the paragraph's last line then, so a marker ending it names the paragraph, whose id caption moves onto the figure as it moves attributes ending a caption. A marker before the caption line is not at the end of the paragraph, as in Obsidian.
describe("block-ids with caption", () => {
  const render = renderAll([`blockIds`, `caption`]);

  it.each([
    {
      name: "a marker ending a caption names the figure",
      input: "Para\n~: A caption ^x",
      expected:
        '<figure class="markdown-caption" id="^x"><p>Para</p><figcaption>A caption</figcaption></figure>'
    },
    {
      name: "a marker on its own line after a caption names the figure",
      input: "Para\n~: A caption\n^x",
      expected:
        '<figure class="markdown-caption" id="^x"><p>Para</p><figcaption>A caption</figcaption></figure>'
    },
    {
      name: "a marker alone after a figure names the figure",
      input: "![a](pic.png)\n~: A caption\n\n^fig",
      expected:
        '<figure class="markdown-caption" id="^fig"><img src="pic.png" alt="a"><figcaption>A caption</figcaption></figure>'
    },
    {
      name: "a marker ending a code block's caption names the figure",
      input: "```\ncode\n```\n~: A caption ^c",
      expected:
        '<figure class="markdown-caption" id="^c"><pre><code>code\n</code></pre><figcaption>A caption</figcaption></figure>'
    },
    {
      name: "a marker before a caption line is text",
      input: "Para ^x\n~: A caption",
      expected:
        '<figure class="markdown-caption"><p>Para ^x</p><figcaption>A caption</figcaption></figure>'
    }
  ])("$name", ({ input, expected }) => {
    expect(render(input)).toStrictEqual(three(expected));
  });
});

// A paragraph a marker empties is removed, not left for squeeze-paragraphs.
describe("block-ids with squeeze-paragraphs", () => {
  const render = renderAll([`blockIds`, `squeezeParagraphs`]);

  it("leaves no paragraph where a marker stood alone", () => {
    expect(render("para\n\n^x\n\nnext")).toStrictEqual(
      three('<p id="^x">para</p><p>next</p>')
    );
    expect(render("^first\n\npara")).toStrictEqual(three("<p>para</p>"));
  });
});

// unwrap-images takes an image out of a paragraph that holds nothing else and gives it the paragraph's id, as it does an id attrs gives the paragraph, so a link to the marker's id still finds the image. A paragraph of several images keeps its id, and stays.
describe("block-ids with unwrap-images", () => {
  const render = renderAll([`blockIds`, `unwrapImages`]);

  it("gives a named image paragraph's id to the image it unwraps", () => {
    expect(render("![a](pic.png) ^img")).toStrictEqual(
      three('<img src="pic.png" alt="a" id="^img">')
    );
    expect(render("![a](pic.png)\n\n^img")).toStrictEqual(
      three('<img src="pic.png" alt="a" id="^img">')
    );
  });

  it("keeps a named paragraph of several images", () => {
    expect(render("![a](a.png) ![b](b.png) ^pair")).toStrictEqual(
      three(
        '<p id="^pair"><img src="a.png" alt="a"> <img src="b.png" alt="b"></p>'
      )
    );
  });
});

// The delimiter and abbreviation plugins leave a paragraph's last text where a marker ends it; a marker inside their elements is text. Superscript shares the caret: `^st^` is one, and the marker after it is still read.
describe("block-ids with mark, kbd, abbr and sup", () => {
  const render = renderAll([`blockIds`, `mark`, `kbd`, `abbr`, `sup`]);

  it.each([
    {
      name: "a marker after a highlight names the paragraph",
      input: "text ==mark== ^m",
      expected: '<p id="^m">text <mark>mark</mark></p>'
    },
    {
      name: "a marker inside a highlight is text",
      input: "text ==mark ^m==",
      expected: "<p>text <mark>mark ^m</mark></p>"
    },
    {
      name: "a marker after a key names the paragraph",
      input: "text [[Ctrl]] ^k",
      expected: '<p id="^k">text <kbd>Ctrl</kbd></p>'
    },
    {
      name: "a marker inside a key is text",
      input: "text [[Ctrl ^k]]",
      expected: "<p>text <kbd>Ctrl ^k</kbd></p>"
    },
    {
      name: "a marker after an abbreviation names the paragraph",
      input: "*[HTML]: Hyper Text\n\nSome HTML ^HTML",
      expected: '<p id="^HTML">Some <abbr title="Hyper Text">HTML</abbr></p>'
    },
    {
      name: "an identifier that is also a term is taken as the marker first",
      input: "*[x]: def\n\ntext ^x",
      expected: '<p id="^x">text</p>'
    },
    {
      name: "a superscript before a marker stays one",
      input: "31^st^ of May ^date",
      expected: '<p id="^date">31<sup>st</sup> of May</p>'
    },
    {
      name: "a superscript is not a marker",
      input: "a ^b^",
      expected: "<p>a <sup>b</sup></p>"
    }
  ])("$name", ({ input, expected }) => {
    expect(render(input)).toStrictEqual(three(expected));
  });
});

// markdown-it has no footnotes: a GFM footnote is remark's and Sätteri's, so these compare those two presets.
describe("block-ids with GFM footnotes", () => {
  const render = renderAll([`blockIds`]);

  it("names a footnote definition's paragraph and the paragraph that references it", () => {
    const [, remark, satteri] = render("text[^1] ^fn\n\n[^1]: note ^blk");
    expect(remark).toBe(
      '<p id="^fn">text<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref aria-describedby="footnote-label">1</a></sup></p><section data-footnotes class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2><ol><li id="user-content-fn-1"><p id="^blk">note <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p></li></ol></section>'
    );
    expect(satteri).toBe(remark);
  });
});
