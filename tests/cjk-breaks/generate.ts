// Paragraphs from a small alphabet, for comparing the plugin with the reference and the engines with each other on more inputs than anyone would write by hand. The generator is seeded, so a failure names an input that comes back on the next run.

// Each kind of character the rule tells apart, and the markup a paragraph of them can turn into: an ideograph, a kana, a Hangul syllable, an ASCII letter, a space, CJK punctuation, a fullwidth form, a wide emoji, the zero-width space, an asterisk (emphasis, a list, a rule), a backtick (a code span, a fence), and line endings.
export const ALPHABET = [
  `日`,
  `あ`,
  `한`,
  `a`,
  ` `,
  `。`,
  `Ａ`,
  `🎉`,
  `​`,
  `*`,
  "`",
  `\n`,
  `\r\n`,
  `\r`
] as const;

// mulberry32: small, fast, and the same sequence on every runtime.
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

/** `count` paragraphs of 2 to 24 characters of {@link ALPHABET}, the same ones for the same `seed`. */
export const paragraphs = (count: number, seed: number): string[] => {
  const next = random(seed);
  return Array.from({ length: count }, () => {
    const length = 2 + Math.floor(next() * 23);
    let text = ``;
    for (let i = 0; i < length; i++)
      text += ALPHABET[Math.floor(next() * ALPHABET.length)];
    return text;
  });
};
