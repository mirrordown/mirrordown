// Generated inputs for the comparisons with the reference packages and between the engines: short strings drawn from a small alphabet that provokes every clause of the flanking rule. The generator is seeded, so a failing string can be replayed, and the same strings can be run through Sätteri when it gains the rule.

/** mulberry32: a small seeded generator, the same sequence on every platform. */
const random = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** The characters every generated string is drawn from, each with what it stands for. Delimiters are listed more than once, so most strings hold a few. */
export const ALPHABET: readonly string[] = [
  // Delimiters that both reference packages handle.
  `*`,
  `*`,
  `*`,
  `_`,
  `_`,
  `~`,
  `~`,
  // Whitespace.
  ` `,
  // An ASCII letter, and ASCII punctuation.
  `a`,
  `"`,
  `(`,
  `)`,
  `.`,
  // A kana, an ideograph and a Hangul syllable.
  `あ`,
  `字`,
  `한`,
  // CJK punctuation.
  `。`,
  `「`,
  `」`,
  `（`,
  `）`,
  // A fullwidth form.
  `Ａ`,
  // An emoji: wide, not a CJK character, and punctuation (So) outside the Basic Multilingual Plane.
  `🎉`,
  // A non-emoji variation selector, and U+FE01 after a quotation mark, which asks for its fullwidth form.
  `︀`,
  `︁`,
  `“`,
  // An ideographic variation selector, outside the Basic Multilingual Plane.
  `\u{e0100}`,
  // An ideograph outside the Basic Multilingual Plane.
  `𠮷`
];

/** The alphabet with Mirrordown's own delimiters added, for the comparison between the engines. */
export const SPAN_ALPHABET: readonly string[] = [
  ...ALPHABET,
  `==`,
  `++`,
  `--`,
  `||`,
  `^`
];

/** The seed every comparison uses. */
export const SEED = 20_261_125;

/**
 * `count` strings of 1 to `maxLength` characters drawn from `alphabet`, the same for the same arguments.
 */
export const generate = (
  count: number,
  alphabet: readonly string[] = ALPHABET,
  seed = SEED,
  maxLength = 10
): string[] => {
  const next = random(seed);
  const pick = (): string =>
    alphabet[Math.floor(next() * alphabet.length)] ?? ``;
  return Array.from({ length: count }, () => {
    const length = 1 + Math.floor(next() * maxLength);
    return Array.from({ length }, pick).join(``);
  });
};
