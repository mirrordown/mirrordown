import { describe, expect, it } from "vite-plus/test";
import { BUILTIN_TAB_ICONS } from "../../packages/core/src/tab-icons";

// Each distinct built-in SVG, once: a key's icon, or both halves of its light and dark pair.
const svgs = [
  ...new Set(
    Object.values(BUILTIN_TAB_ICONS).flatMap((icon) =>
      typeof icon === `string` ? [icon] : [icon.light, icon.dark]
    )
  )
];
const idsOf = (svg: string): string[] =>
  [...svg.matchAll(/\sid="([^"]+)"/g)].map(([, id = ``]) => id);
const all = svgs.flatMap(idsOf);

// An inline SVG's ids are the page's ids: a gradient or clip path is found by `url(#id)` in the whole document. So the generator names every id after the plugin and the icon, which keeps two icons, or an icon and the page it is on, from finding each other's definitions.
describe(`tab-icons: the built-in icons' ids`, () => {
  it(`are namespaced, so they can't be an id the page uses`, () => {
    expect(all.length).toBeGreaterThan(0);
    expect(all.filter((id) => !id.startsWith(`markdown-tab-icon-`))).toEqual(
      []
    );
  });

  it(`are not shared by two icons, nor by an icon's light and dark variants`, () => {
    expect(new Set(all).size).toBe(all.length);
  });

  it(`are what each icon's own references point to`, () => {
    for (const svg of svgs) {
      const ids = new Set(idsOf(svg));
      const references = [
        ...svg.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)
      ].map(([, url, href]) => url ?? href ?? ``);
      expect(references.filter((id) => !ids.has(id))).toEqual([]);
    }
  });
});
