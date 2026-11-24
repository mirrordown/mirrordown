import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { TASK_MARKERS } from "../../packages/core/src";

const packages = join(import.meta.dirname, "..", "..", "packages");
const read = (name: string): string =>
  readFileSync(join(packages, name, "src", "task-lists.css"), "utf8");

const css = read("mdit-task-lists");

describe("task-lists stylesheet", () => {
  // The engines emit the same HTML, so one stylesheet styles all of them: a fix made to one copy and not the others would make the engines look different.
  it.each(["remd-task-lists", "sat-task-lists"])(
    "is the same file in %s as in mdit-task-lists",
    (name) => {
      expect(read(name)).toBe(css);
    }
  );

  // A default marker without its rules would render as the browser's checkbox, which reads as a to-do: the icon is what tells the states apart.
  it.each(Object.keys(TASK_MARKERS))(
    "draws an icon and a colour for %s, in a tight and a loose list",
    (marker) => {
      const item = `li[data-task="${marker}"]`;
      expect(css).toContain(`${item} {\n    --_task-lists-color: light-dark(`);
      expect(css).toContain(`${item} > input[type="checkbox"],`);
      expect(css).toContain(`${item} > p > input[type="checkbox"]`);
      expect(css).toMatch(
        new RegExp(
          `${item.replace(/[[\]"?/!<>-]/g, "\\$&")} \\{[^}]*--_task-lists-icon: url\\("data:image/svg\\+xml,`
        )
      );
    }
  );

  // To-do and done keep the browser's checkbox: only an item with a marker of its own is restyled.
  it("leaves the to-do and done boxes alone", () => {
    expect(css).not.toMatch(/\.task-list-item\b/);
    expect(css).not.toMatch(/(^|[\s,])li\s*>\s*input/m);
  });

  it("keeps its visual rules in its layer", () => {
    const outside = css
      .replace(/\/\*[\s\S]*?\*\//g, ``)
      .replace(/@layer markdown-task-lists \{[\s\S]*\}\s*$/, ``);
    // Only the registration of the private colour property, which a layer cannot hold, sits outside.
    expect(outside.trim()).toMatch(/^@property --_task-lists-color \{[^}]*\}$/);
  });
});
