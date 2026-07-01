/* oxlint-disable no-console, no-continue */
// ---------------------------------------------------------------------------
// load-env — populate process.env from the user's ~/.env, cross-platform
// ---------------------------------------------------------------------------
// The JSR scripts need a JSR_TOKEN. The old usage `JSR_TOKEN=jsr_xxx node …` is
// a POSIX-shell-only inline env prefix and fails in PowerShell/cmd on Windows.
// Instead, keep the token in a personal `~/.env` (never committed) and import
// this module at the top of a script to load it.
//
// Reads `${HOME}/.env` (via os.homedir(), so it works on every OS), parses
// simple `KEY=value` lines, and sets each var ONLY if it isn't already present
// in process.env — so an explicit `JSR_TOKEN=… node …` (POSIX) or a
// pre-exported var still takes precedence. Missing file is a no-op.
//
// Deliberately dependency-free and tiny: it handles `KEY=value`, `export KEY=…`,
// surrounding single/double quotes, `#` comments, and blank lines — enough for a
// secrets file, not a full dotenv spec.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ENV_PATH = join(homedir(), ".env");

const stripQuotes = (v) =>
  (v.startsWith('"') && v.endsWith('"')) ||
  (v.startsWith("'") && v.endsWith("'"))
    ? v.slice(1, -1)
    : v;

let loaded = 0;
try {
  const text = readFileSync(ENV_PATH, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line
      .slice(0, eq)
      .replace(/^export\s+/, "")
      .trim();
    if (!key || key in process.env) continue; // don't clobber an explicit value
    process.env[key] = stripQuotes(line.slice(eq + 1).trim());
    loaded++;
  }
} catch (err) {
  // ENOENT (no ~/.env) is fine — the script falls back to whatever is already
  // in process.env. Surface anything else (e.g. a permission error) as a hint.
  if (err.code !== "ENOENT") {
    console.warn(`load-env: could not read ${ENV_PATH}: ${err.message}`);
  }
}

export const loadedFromUserEnv = loaded;
