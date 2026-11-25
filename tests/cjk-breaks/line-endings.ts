// The fixture files are stored with LF line endings (`.gitattributes`), and documents also arrive with CRLF and with a lone CR, which the remark and Sätteri plugins find in their text nodes as written. So every case runs three times, once with each, and is compared with its line endings unified (`comparable`): which one the HTML keeps is the engine's, not the plugin's.
const LINE_ENDINGS = [
  [`LF`, `\n`],
  [`CRLF`, `\r\n`],
  [`CR`, `\r`]
] as const;

export const withLineEndings = <C extends { name: string; input: string }>(
  cases: readonly C[]
): C[] =>
  LINE_ENDINGS.flatMap(([label, ending]) =>
    cases.map((fixture) => ({
      ...fixture,
      name: `${fixture.name} (${label})`,
      input: fixture.input.replaceAll(`\n`, ending)
    }))
  );
