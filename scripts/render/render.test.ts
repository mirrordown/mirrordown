// The worker half of `scripts/render.mjs`: TypeScript source cannot be run with plain node, so the script hands its request to this file through the test runner, which resolves the packages to their source as the tests do.
import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { markdownIt, remark, satteri } from "../../tests/presets/engines.js";
import { features } from "../../tests/presets/features.js";

interface Request {
  input: string;
  only?: string[];
  off?: string[];
  options?: Record<string, unknown>;
  output: string;
}

const requestPath = process.env.MIRRORDOWN_RENDER ?? ``;

describe("render", () => {
  it.runIf(requestPath !== ``)("renders the request", () => {
    const request = JSON.parse(readFileSync(requestPath, `utf8`)) as Request;
    const known = new Set<string>([...features.map(({ key }) => key), `gfm`]);
    const unknown = [...(request.only ?? []), ...(request.off ?? [])].filter(
      (key) => !known.has(key)
    );
    // `only` keeps the named features and turns every other one in the table off; `off` and `options` are applied after it.
    const options: Record<string, unknown> = {
      ...(request.only
        ? Object.fromEntries(
            features
              .filter(({ key }) => !request.only?.includes(key))
              .map(({ key }) => [key, false])
          )
        : {}),
      ...Object.fromEntries((request.off ?? []).map((key) => [key, false])),
      ...request.options
    };
    const render = (engine: (input: string) => string): string => {
      try {
        return engine(request.input);
      } catch (error) {
        return `THREW: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`;
      }
    };
    writeFileSync(
      request.output,
      JSON.stringify({
        unknown,
        features: [...known],
        options,
        mdit: render(markdownIt(options)),
        remd: render(remark(options)),
        sat: render(satteri(options))
      })
    );
    expect(request.output).not.toBe(``);
  });
});
