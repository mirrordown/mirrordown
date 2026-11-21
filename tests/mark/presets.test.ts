import { describe, expect, it } from "vite-plus/test";
import { engines } from "../presets/engines.js";

const ROCKET = "\u{1F680}"; // 🚀
const BUG = "\u{1F41B}"; // 🐛

// The presets take `mark` as `githubAlerts` is taken: `false` turns it off, `true` or nothing is the defaults, and an object goes to the plugin.
describe.each(engines)(
  "mark options through the preset (%s)",
  (_engine, render) => {
    it("passes the markers option to the plugin", () => {
      expect(
        render({ mark: { markers: { [ROCKET]: "release" } } })(
          `==${ROCKET} Ship==`
        )
      ).toBe(`<p><mark data-highlight="release">${ROCKET} Ship</mark></p>`);
    });

    it("keeps the default markers beside the ones it adds", () => {
      expect(
        render({ mark: { markers: { [ROCKET]: "release" } } })(`==${BUG} Bug==`)
      ).toBe(`<p><mark data-highlight="bug">${BUG} Bug</mark></p>`);
    });
  }
);
