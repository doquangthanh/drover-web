// Keeps this UI in step with drover-core/design/tokens.json (the source of truth for both the web and the native window).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { aceThemeFor } from "../files/editor-modes";
import { TERM_THEMES, THEME_DEFS } from "./theme-data.generated";

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const core = process.env.DROVER_CORE_DIR || resolve(frontend, "../../drover-core");
const generator = join(core, "design/gen-tokens.mjs");

describe("design tokens", () => {
  // Needs a drover-core checkout next to this repo or in DROVER_CORE_DIR (CI sets it). Only this repo's files are checked.
  it.skipIf(!existsSync(generator))("generated colours match drover-core/design/tokens.json", () => {
    expect(() => execFileSync(process.execPath, [generator, "--check", "--only", "web", "--web", frontend], { stdio: "pipe" })).not.toThrow();
  });

  it("every theme has an xterm palette and its own code-editor theme", () => {
    const fallback = aceThemeFor("dark");
    for (const t of THEME_DEFS) {
      expect(TERM_THEMES[t.id], `terminal palette for ${t.id}`).toBeTruthy();
      if (t.id !== "dark") expect(aceThemeFor(t.id), `Ace theme for ${t.id} (add it to editor-modes.ts)`).not.toBe(fallback);
    }
  });
});
