import { describe, expect, it } from "vite-plus/test";
import { engines } from "./engines.js";
import { features } from "./features.js";
import {
  HOSTILE_TIME_LIMIT,
  comparable,
  hostileCases
} from "../utils/hostile.js";

// The inline sets that wrap text in a pair of delimiters, each with the way an author writes it and the character its scanner looks for.
const sets: readonly {
  key: (typeof features)[number][`key`];
  wrap: (text: string) => string;
  marker: string;
}[] = [
  { key: `del`, wrap: (text) => `--${text}--`, marker: `-` },
  { key: `ins`, wrap: (text) => `++${text}++`, marker: `+` },
  { key: `kbd`, wrap: (text) => `[[${text}]]`, marker: `[` },
  { key: `mark`, wrap: (text) => `==${text}==`, marker: `=` },
  { key: `spoiler`, wrap: (text) => `||${text}||`, marker: `|` },
  { key: `tags`, wrap: (text) => `#${text} `, marker: `#` }
];

// Input an author would never write on purpose still arrives: pasted logs, generated files, text from another system. None of it may throw, hang, or make the engines disagree.
describe.each(sets)("hostile input through $key", ({ key, wrap, marker }) => {
  // Only the set under test is on, so a failure names it.
  const options = Object.fromEntries(
    features
      .filter((feature) => feature.key !== key)
      .map((feature) => [feature.key, false])
  );
  const renderers = engines.map(([, render]) => render(options));
  // The same pipelines with the set off too: what the engines take by themselves.
  const bare = engines.map(([, render]) =>
    render({ ...options, [key]: false })
  );
  const timed = (run: () => void): number => {
    const started = performance.now();
    run();
    return performance.now() - started;
  };

  it.each(hostileCases(wrap, marker))("$name", ({ input }) => {
    const html: string[] = [];
    const without = timed(() => bare.forEach((render) => render(input)));
    const withSet = timed(() =>
      renderers.forEach((render) => html.push(comparable(render(input))))
    );
    expect(withSet - without).toBeLessThan(HOSTILE_TIME_LIMIT);
    expect(html).toStrictEqual(html.map(() => html[0]));
  });
});
