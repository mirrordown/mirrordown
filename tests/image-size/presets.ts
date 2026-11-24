import { features } from "../presets/features.js";

/** Preset options with only the named features on, so a suite renders them in the order the presets list them, and nothing else. */
export const only = (
  ...keys: ReadonlyArray<(typeof features)[number][`key`]>
): Record<string, boolean> =>
  Object.fromEntries(features.map(({ key }) => [key, keys.includes(key)]));
