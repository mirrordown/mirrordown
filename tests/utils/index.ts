export function parseCases(fixtureMd: string): Array<{ name: string; input: string }> {
  const sections: Array<{ name: string; input: string }> = [];
  const pattern = /<!--\s*@case:\s*(.+?)\s*-->/g;
  let match: RegExpExecArray | null;
  let lastName = "";
  let lastEnd = 0;

  while ((match = pattern.exec(fixtureMd)) !== null) {
    if (lastName) {
      sections.push({ name: lastName, input: fixtureMd.slice(lastEnd, match.index).trim() });
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
  fixtureHtml: string,
): Array<{ name: string; input: string; expected: string }> {
  const split = (content: string): Array<{ name: string; content: string }> => {
    const sections: Array<{ name: string; content: string }> = [];
    const pattern = /<!--\s*@case:\s*(.+?)\s*-->/g;
    let match: RegExpExecArray | null;
    let lastName = "";
    let lastEnd = 0;

    while ((match = pattern.exec(content)) !== null) {
      if (lastName) {
        sections.push({ name: lastName, content: content.slice(lastEnd, match.index).trim() });
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

  return inputs.map((input, i) => ({
    name: input.name,
    input: input.content,
    expected: normalizeHtml(expecteds[i].content),
  }));
}
