// Forked and modified from https://github.com/fabon-f/remark-denden-ruby

// Tokenizer + fromMarkdown handlers + mdast post-processing all live here;
// bridging the three layers requires casts the per-layer types can't infer.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import { visit } from "unist-util-visit";
import { fromMarkdown } from "mdast-util-from-markdown";
import { markdownLineEnding } from "micromark-util-character";
import type { Plugin, Transformer } from "unified";
import type { Data } from "unist";
import type { Root, Nodes, PhrasingContent } from "mdast";
import type {
  Construct,
  Extension as MicromarkExtension,
  State,
  Effects,
  Code,
  TokenizeContext
} from "micromark-util-types";
import type { Extension as FromMarkdownExtension } from "mdast-util-from-markdown";

// ---- mdast node types ----

/** Options for the {@link remarkRuby} plugin. */
export interface RubyOptions {
  /** Fallback parenthesis characters emitted as `<rp>` for browsers without ruby support. */
  rp?: [string, string];
}

/** Data attached to a {@link Ruby} node (renders as `<ruby>`). */
export interface RubyData extends Data {
  hName: "ruby";
}

/** Data attached to an {@link Rt} node (renders as `<rt>`). */
export interface RtData extends Data {
  hName: "rt";
}

/** Data attached to an {@link Rp} node (renders as `<rp>`). */
export interface RpData extends Data {
  hName: "rp";
}

/** An mdast node for ruby fallback parentheses, rendered as `<rp>`. */
export interface Rp {
  type: "rp";
  children: [{ type: "text"; value: string }];
  data: RpData;
}

/** An mdast node for ruby reading text, rendered as `<rt>`. */
export interface Rt {
  type: "rt";
  children: PhrasingContent[];
  data: RtData;
}

/** An mdast node for a ruby annotation, rendered as `<ruby>`. */
export interface Ruby {
  type: "ruby";
  children: Array<PhrasingContent | Rt | Rp>;
  data: RubyData;
}

// ---- Micromark extension ----

function tokenizeRuby(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  return start;

  function start(code: Code): State | undefined {
    if (code !== 123 /* { */) return nok(code);
    effects.enter("ruby");
    effects.enter("rubyMarker");
    effects.consume(code);
    effects.exit("rubyMarker");
    return beforeBase;
  }

  function beforeBase(code: Code): State | undefined {
    if (
      code === null ||
      markdownLineEnding(code) ||
      code === 124 /* | */ ||
      code === 125 /* } */
    ) {
      return nok(code);
    }
    effects.enter("rubyBaseData");
    effects.consume(code);
    return base;
  }

  function base(code: Code): State | undefined {
    if (code === null || markdownLineEnding(code)) return nok(code);
    if (code === 124 /* | */) {
      effects.exit("rubyBaseData");
      effects.enter("rubyMarker");
      effects.consume(code);
      effects.exit("rubyMarker");
      return beforeReading;
    }
    if (code === 125 /* } */ || code === 123 /* { */) return nok(code);
    effects.consume(code);
    return base;
  }

  function beforeReading(code: Code): State | undefined {
    if (code === null || markdownLineEnding(code) || code === 125 /* } */) {
      return nok(code);
    }
    effects.enter("rubyReadingData");
    effects.consume(code);
    return reading;
  }

  function reading(code: Code): State | undefined {
    if (code === null || markdownLineEnding(code)) return nok(code);
    if (code === 125 /* } */) {
      effects.exit("rubyReadingData");
      effects.enter("rubyMarker");
      effects.consume(code);
      effects.exit("rubyMarker");
      effects.exit("ruby");
      return ok;
    }
    effects.consume(code);
    return reading;
  }
}

const rubyConstruct: Construct = {
  name: "ruby",
  tokenize: tokenizeRuby
};

const rubyMicromarkExtension: MicromarkExtension = {
  text: { 123: rubyConstruct }
};

// ---- fromMarkdown extension ----

interface RubyInProgress {
  data: { hName: "ruby"; rawBase: string; rawReading: string };
}

const rubyFromMarkdownExtension: FromMarkdownExtension = {
  enter: {
    ruby(token) {
      this.enter(
        {
          type: "ruby",
          children: [],
          data: { hName: "ruby", rawBase: "", rawReading: "" }
        } as unknown as Nodes,
        token
      );
    }
  },
  exit: {
    rubyBaseData(token) {
      const node = this.stack[
        this.stack.length - 1
      ] as unknown as RubyInProgress;
      node.data.rawBase = this.sliceSerialize(token);
    },
    rubyReadingData(token) {
      const node = this.stack[
        this.stack.length - 1
      ] as unknown as RubyInProgress;
      node.data.rawReading = this.sliceSerialize(token);
    },
    ruby(token) {
      // An image's alt is the plain text of its label, computed when the label
      // closes, before the transformer fills in ruby children. Alt text is an
      // attribute and renders no markup, so give the node its source as a
      // provisional text child: a ruby in alt text stays verbatim
      // (`alt="{base|reading}"`), as in mdit. The transformer replaces it.
      const node = this.stack[this.stack.length - 1] as unknown as Ruby;
      node.children = [{ type: "text", value: this.sliceSerialize(token) }];
      this.exit(token);
    }
  }
};

// ---- Plugin ----

// What a base or a reading that would parse as an HTML block is given to start with while it is parsed: a private-use character no author's text holds there.
const START = String.fromCharCode(0xe003);

/** remark plugin for ruby annotation syntax (`{base|reading}`), rendering `<ruby>` elements. */
export const remarkRuby: Plugin<[RubyOptions?], Root> = function (
  options = {}
) {
  const { rp } = options;
  const hasRp = Array.isArray(rp) && rp[0] !== "" && rp[1] !== "";

  // oxlint-disable-next-line typescript/no-explicit-any
  const data = this.data() as Partial<Record<string, any[]>>;
  (data.micromarkExtensions ??= []).push(rubyMicromarkExtension);
  (data.fromMarkdownExtensions ??= []).push(rubyFromMarkdownExtension);

  // By transformation time all plugins have pushed into data, so forwarding these
  // arrays to fromMarkdown gives parseInline access to GFM strikethrough etc.
  // `definitions` is a placeholder definition for each link and footnote label the document defines (see `definitionsOf`): a base or a reading is parsed alone, where a reference to a label defined elsewhere would be text.
  function parseInline(raw: string, definitions: string): PhrasingContent[] {
    // Spaces and tabs around a base or a reading are not part of it, as a paragraph's are not; one that is nothing but whitespace is kept.
    const text = raw.replace(/^[ \t]+|[ \t]+$/g, "") || raw;
    if (!text) return [];
    const parse = (source: string): Root["children"][number] | undefined =>
      fromMarkdown(source + definitions, {
        extensions: data.micromarkExtensions,
        mdastExtensions: data.fromMarkdownExtensions
      }).children[0];
    const first = parse(text);
    if (first?.type === "paragraph") return first.children;
    // A base or a reading that opens with a tag is an HTML block when it stands alone, where in the document it is inline content, as markdown-it reads it. Parsed after a character, which is then dropped, it is a paragraph.
    if (first?.type === "html") {
      const again = parse(START + text);
      const children = again?.type === "paragraph" ? again.children : [];
      const lead = children.at(0);
      if (lead?.type === "text" && lead.value.startsWith(START)) {
        lead.value = lead.value.slice(START.length);
        return lead.value ? children : children.slice(1);
      }
    }
    return [{ type: "text", value: text }];
  }

  const makeRt = (children: PhrasingContent[]): Rt => ({
    type: "rt",
    children,
    data: { hName: "rt" }
  });

  const makeRp = (text: string): Rp => ({
    type: "rp",
    children: [{ type: "text", value: text }],
    data: { hName: "rp" }
  });

  // Only recognition matters: the reference a fragment is parsed to resolves against the document's own definitions when the tree is rendered.
  const definitionsOf = (tree: Root): string => {
    const labels: string[] = [];
    visit(tree, "definition", (node) => {
      labels.push(`[${node.label ?? node.identifier}]: #`);
    });
    visit(tree, "footnoteDefinition", (node) => {
      labels.push(`[^${node.label ?? node.identifier}]: #`);
    });
    return labels.length > 0 ? `\n\n${labels.join("\n")}` : "";
  };

  const transformer: Transformer<Root> = (tree) => {
    const definitions = definitionsOf(tree);
    const inTableCell = new Set<Ruby>();
    visit(tree, "tableCell", (cell) => {
      visit(cell, "ruby", (node: Ruby) => {
        inTableCell.add(node);
      });
    });
    visit(tree, "ruby", (node: Ruby) => {
      // oxlint-disable-next-line typescript/no-explicit-any
      const raw = node.data as any;
      // A node the transformer has already filled in has no raw fields left: running over the same tree again changes nothing.
      if (typeof raw.rawBase !== "string") return;
      // Strip a trailing backslash from rawBase: when {word\|reading} appears in a GFM
      // table cell, the table tokenizer preserves the raw \| in the cell content. Our
      // micromark state machine consumes \ as base data and | as the separator, leaving
      // rawBase with a trailing \. Removing it lets parseInline see the correct text.
      // Outside a table the backslash is the author's and stays, as in mdit.
      const rawBase = inTableCell.has(node)
        ? (raw.rawBase as string).replace(/\\$/, "")
        : (raw.rawBase as string);
      const baseChildren = parseInline(rawBase, definitions);
      const readingChildren = parseInline(
        raw.rawReading as string,
        definitions
      );

      node.children = [
        ...baseChildren,
        ...(hasRp ? [makeRp(rp[0])] : []),
        makeRt(readingChildren),
        ...(hasRp ? [makeRp(rp[1])] : [])
      ];

      delete raw.rawBase;
      delete raw.rawReading;
    });
  };

  return transformer;
};
