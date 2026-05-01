// Forked and modified from https://github.com/fabon-f/remark-denden-ruby

import { visit } from "unist-util-visit";
import { fromMarkdown } from "mdast-util-from-markdown";
import { markdownLineEnding } from "micromark-util-character";
import type { Plugin, Transformer } from "unified";
import type { Data } from "unist";
import type { Root, Nodes, Paragraph, PhrasingContent } from "mdast";
import type {
  Construct,
  Extension as MicromarkExtension,
  State,
  Effects,
  Code,
  TokenizeContext,
} from "micromark-util-types";
import type { Extension as FromMarkdownExtension } from "mdast-util-from-markdown";

// ---- Token type registration ----

declare module "micromark-util-types" {
  interface TokenTypeMap {
    ruby: "ruby";
    rubyMarker: "rubyMarker";
    rubyBaseData: "rubyBaseData";
    rubyReadingData: "rubyReadingData";
  }
}

// ---- mdast node types ----

export interface RubyOptions {
  rp?: [string, string];
}

interface RubyData extends Data {
  hName: "ruby";
}

interface RtData extends Data {
  hName: "rt";
}

interface RpData extends Data {
  hName: "rp";
}

interface Rp {
  type: "rp";
  children: [{ type: "text"; value: string }];
  data: RpData;
}

interface Rt {
  type: "rt";
  children: PhrasingContent[];
  data: RtData;
}

interface Ruby {
  type: "ruby";
  children: (PhrasingContent | Rt | Rp)[];
  data: RubyData;
}

declare module "mdast" {
  interface PhrasingContentMap {
    ruby: Ruby;
  }

  interface RootContentMap {
    ruby: Ruby;
  }
}

// ---- Micromark extension ----

function tokenizeRuby(this: TokenizeContext, effects: Effects, ok: State, nok: State): State {
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
    if (code === null || markdownLineEnding(code) || code === 124 /* | */ || code === 125 /* } */) {
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
  tokenize: tokenizeRuby,
};

const rubyMicromarkExtension: MicromarkExtension = {
  text: { 123: rubyConstruct },
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
          data: { hName: "ruby", rawBase: "", rawReading: "" },
        } as unknown as Nodes,
        token,
      );
    },
  },
  exit: {
    rubyBaseData(token) {
      const node = this.stack[this.stack.length - 1] as unknown as RubyInProgress;
      node.data.rawBase = this.sliceSerialize(token);
    },
    rubyReadingData(token) {
      const node = this.stack[this.stack.length - 1] as unknown as RubyInProgress;
      node.data.rawReading = this.sliceSerialize(token);
    },
    ruby(token) {
      this.exit(token);
    },
  },
};

// ---- Plugin ----

export const remarkRuby: Plugin<[RubyOptions?], Root> = function (options = {}) {
  const { rp } = options;
  const hasRp = Array.isArray(rp) && rp.length === 2 && rp[0] !== "" && rp[1] !== "";

  // oxlint-disable-next-line typescript/no-explicit-any
  const data = this.data() as Record<string, any[]>;
  (data.micromarkExtensions ??= []).push(rubyMicromarkExtension);
  (data.fromMarkdownExtensions ??= []).push(rubyFromMarkdownExtension);

  // By transformation time all plugins have pushed into data, so forwarding these
  // arrays to fromMarkdown gives parseInline access to GFM strikethrough etc.
  function parseInline(text: string): PhrasingContent[] {
    if (!text) return [];
    const tree = fromMarkdown(text, {
      extensions: data.micromarkExtensions,
      mdastExtensions: data.fromMarkdownExtensions,
    });
    const para = tree.children[0] as Paragraph | undefined;
    return para?.type === "paragraph" ? para.children : [{ type: "text", value: text }];
  }

  const makeRt = (children: PhrasingContent[]): Rt => ({
    type: "rt",
    children,
    data: { hName: "rt" },
  });

  const makeRp = (text: string): Rp => ({
    type: "rp",
    children: [{ type: "text", value: text }],
    data: { hName: "rp" },
  });

  const transformer: Transformer<Root> = (tree) => {
    visit(tree, "ruby", (node: Ruby) => {
      // oxlint-disable-next-line typescript/no-explicit-any
      const raw = node.data as any;
      // Strip a trailing backslash from rawBase: when {word\|reading} appears in a GFM
      // table cell, the table tokenizer preserves the raw \| in the cell content. Our
      // micromark state machine consumes \ as base data and | as the separator, leaving
      // rawBase with a trailing \. Removing it lets parseInline see the correct text.
      const rawBase = (raw.rawBase as string).replace(/\\$/, "");
      const baseChildren = parseInline(rawBase);
      const readingChildren = parseInline(raw.rawReading as string);

      node.children = [
        ...baseChildren,
        ...(hasRp ? [makeRp(rp![0]!)] : []),
        makeRt(readingChildren),
        ...(hasRp ? [makeRp(rp![1]!)] : []),
      ];

      delete raw.rawBase;
      delete raw.rawReading;
    });
  };

  return transformer;
};
