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

export function normalizeHtml(html: string): string {
  return html.replace(/>\s+</g, "><").trim();
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
