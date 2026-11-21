// Where Mirrordown stands on each example of the Obsidian Flavored Markdown spec in `fixtures/SPEC.md`. The spec is a reference for what Obsidian authors write, not a contract: its "Required output" leaves markup to the publisher, so `expected/ofm.html` holds Mirrordown's own HTML. This file says what each example's output means.

/** What an example's current output is, measured against the spec. */
export type State =
  /** Meets the spec's required output. */
  | `conforms`
  /** Not yet: a planned plugin set or change will handle it. */
  | `pending`
  /** Not planned for now. */
  | `deferred`
  /** A deliberate difference from the spec. */
  | `diverges`
  /** Decided by the host or needs a vault: not a Markdown plugin's to render. */
  | `out of scope`;

export interface Status {
  state: State;
  /** What will change it, or why it stands. Required for every state but `conforms`. */
  note?: string;
  /** Set when the three engines do not emit the same HTML for this example, with the reason. Such an example has no entry in `expected/ofm.html`; the test fails when the engines start to agree, so the entry cannot outlive the difference. */
  differs?: string;
}

const all = (ids: readonly string[], status: Status): Array<[string, Status]> =>
  ids.map((id) => [id, status]);

const GFM_BASE = `The markdown-it preset has no GFM footnotes, task lists or bare-URL links, and renders ~~x~~ as <s>.`;
const WIKILINKS = `Wikilinks and embeds wait for a revisit of the kbd syntax, which uses the same brackets.`;
const MATH = `Math needs a renderer decision; Sätteri has a built-in feature for it.`;
const RAW_HTML = `Raw HTML is the host's setting: markdown-it escapes it, remark-rehype drops it, Sätteri keeps it.`;

/** Keyed by example number as the spec prints it; a minimal variant is `34-minimal`. */
export const status: ReadonlyMap<string, Status> = new Map<string, Status>([
  ...all(
    [
      `1`,
      `2`,
      `4`,
      `6`,
      `7`,
      `13`,
      `16`,
      `19`,
      `23`,
      `27`,
      `39`,
      `40`,
      `44`,
      `48`,
      `52`,
      `62`,
      `68`
    ],
    { state: `conforms` }
  ),
  // A parser reports a mermaid fence as a code block; the mermaid-pele set draws it.
  [`8`, { state: `conforms` }],
  // Callouts: the spec requires no particular markup, and github-alerts renders these.
  ...all([`28`, `29`, `30`, `31`, `32`], { state: `conforms` }),
  // Text straight against the marker leaves a quote, as the spec chose and Obsidian does.
  [`33`, { state: `conforms` }],
  // The link itself is CommonMark's; the internal-link class is optional.
  [`67`, { state: `conforms` }],

  ...all([`51`, `53`, `54`, `55`], { state: `pending`, note: `Tags (W1-B).` }),
  [`34`, { state: `pending`, note: `Task lists (W2-A).`, differs: GFM_BASE }],
  [
    `34-minimal`,
    { state: `pending`, note: `Task lists (W2-A).`, differs: GFM_BASE }
  ],
  [`35`, { state: `pending`, note: `Task lists (W2-A).` }],
  [`41`, { state: `pending`, note: `Highlight colours (W2-B).` }],
  [`66`, { state: `pending`, note: `Image sizes (W2-B).` }],
  [
    `3`,
    {
      state: `pending`,
      note: `Comments (W3-A); its second line is a wikilink.`,
      differs: `Emphasis crossing a key's brackets ("*[[a*b]]*") is read first by markdown-it and second by remark and Sätteri.`
    }
  ],
  ...all([`10`, `11`, `12`, `43`, `45`, `46`], {
    state: `pending`,
    note: `Comments (W3-A).`
  }),
  ...all([`18`, `20`, `21`, `22`, `24`, `25`, `26`], {
    state: `pending`,
    note: `Block identifiers (W3-B).`
  }),

  ...all([`36`, `36-minimal`, `37`], {
    state: `deferred`,
    note: `GFM base for markdown-it (W4).`,
    differs: GFM_BASE
  }),
  [
    `42`,
    {
      state: `deferred`,
      note: `GFM base for markdown-it (W4). "~not struck~" is a subscript here by design.`,
      differs: GFM_BASE
    }
  ],
  [
    `70`,
    {
      state: `deferred`,
      note: `GFM base for markdown-it (W4).`,
      differs: GFM_BASE
    }
  ],
  [
    `5`,
    {
      state: `deferred`,
      note: `Front matter (W4).`,
      differs: `Only Sätteri removes front matter; the other two render it as a rule and text.`
    }
  ],
  [
    `14`,
    {
      state: `deferred`,
      note: `Table alignment (W4).`,
      differs: `Alignment is written three ways: style="text-align:left", align="left", style="text-align: left".`
    }
  ],
  ...all(
    [`15`, `56`, `57`, `58`, `59`, `60`, `61`, `63`, `64`, `65`, `65-minimal`],
    { state: `deferred`, note: WIKILINKS }
  ),
  ...all([`9`, `47`, `49`, `50`], { state: `deferred`, note: MATH }),
  [
    `69`,
    { state: `deferred`, note: `Inline footnotes depend on the GFM base (W4).` }
  ],
  [
    `38`,
    {
      state: `deferred`,
      note: `Hard line breaks are an engine option, not syntax.`
    }
  ],

  ...all([`17`, `71`], {
    state: `out of scope`,
    note: RAW_HTML,
    differs: RAW_HTML
  })
]);
