export function parseCases(
  fixtureMd: string
): Array<{ name: string; input: string }> {
  const sections: Array<{ name: string; input: string }> = [];
  const pattern = /<!--\s*@case:\s*(.+?)\s*-->/g;
  let match: RegExpExecArray | null;
  let lastName = "";
  let lastEnd = 0;

  while ((match = pattern.exec(fixtureMd)) !== null) {
    if (lastName) {
      sections.push({
        name: lastName,
        input: fixtureMd.slice(lastEnd, match.index).trim()
      });
    }
    lastName = match[1].trim();
    lastEnd = match.index + match[0].length;
  }

  if (lastName) {
    sections.push({ name: lastName, input: fixtureMd.slice(lastEnd).trim() });
  }

  return sections;
}

// A tag, allowing `>` inside quoted attribute values.
const TAG = /<(?:[^"'>]|"[^"]*"|'[^']*')*>/g;

// Engines spell character references differently, and plugins can't change
// that: markdown-it writes `&lt;` `&amp;` `&quot;` `&gt;`, while hast writes
// `&#x3C;` `&#x26;` and leaves `"` and `>` bare in text. An apostrophe is bare
// in markdown-it's attributes and escaped in hast's (`&#x27;`); attribute values
// are double-quoted, so it's safe bare everywhere. Unify the spellings so
// fixtures compare plugin output, not serializer style. Text gets `"` and `>`
// decoded (both are safe unescaped there); inside tags `<` and `>` are decoded
// too (hast leaves both bare in attribute values, where they need no escape),
// but a quote in an attribute value must stay escaped. A raw `&`, or a raw `<`
// in text, is never produced, so a missing escape still fails.
const canonicalReferences = (html: string): string => {
  const spelling = (s: string): string =>
    s
      .replace(/&#(?:x3c|60);/gi, "&lt;")
      .replace(/&#(?:x26|38);/gi, "&amp;")
      .replace(/&#(?:x22|34);/gi, "&quot;")
      .replace(/&#(?:x3e|62);/gi, "&gt;")
      .replace(/&#(?:x27|39);/gi, "'");
  let out = "";
  let last = 0;
  for (const match of html.matchAll(TAG)) {
    out += spelling(html.slice(last, match.index))
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, ">");
    out += spelling(match[0]).replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    last = match.index + match[0].length;
  }
  return (
    out +
    spelling(html.slice(last))
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, ">")
  );
};

export function normalizeHtml(html: string): string {
  return canonicalReferences(html).replace(/>\s+</g, "><").trim();
}

export function parseFixture(
  fixtureMd: string,
  fixtureHtml: string
): Array<{ name: string; input: string; expected: string }> {
  const split = (content: string): Array<{ name: string; content: string }> => {
    const sections: Array<{ name: string; content: string }> = [];
    const pattern = /<!--\s*@case:\s*(.+?)\s*-->/g;
    let match: RegExpExecArray | null;
    let lastName = "";
    let lastEnd = 0;

    while ((match = pattern.exec(content)) !== null) {
      if (lastName) {
        sections.push({
          name: lastName,
          content: content.slice(lastEnd, match.index).trim()
        });
      }
      lastName = match[1].trim();
      lastEnd = match.index + match[0].length;
    }

    if (lastName) {
      sections.push({ name: lastName, content: content.slice(lastEnd).trim() });
    }

    return sections;
  };

  const inputs = split(fixtureMd);
  const expecteds = split(fixtureHtml);

  // Pair by name, not position, so a missing, extra, or reordered case fails
  // loudly instead of silently comparing against a neighbour's expectation.
  const byName = new Map<string, string>();
  for (const { name, content } of expecteds) {
    if (byName.has(name)) throw new Error(`Duplicate expected case: ${name}`);
    byName.set(name, content);
  }
  const names = new Set<string>();
  const cases = inputs.map(({ name, content }) => {
    if (names.has(name)) throw new Error(`Duplicate fixture case: ${name}`);
    names.add(name);
    const expected = byName.get(name);
    if (expected === undefined) throw new Error(`No expected case: ${name}`);
    return { name, input: content, expected: normalizeHtml(expected) };
  });
  const extra = [...byName.keys()].filter((name) => !names.has(name));
  if (extra.length > 0) {
    throw new Error(`Expected cases without a fixture: ${extra.join(", ")}`);
  }
  return cases;
}
