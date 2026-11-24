// Themes: the list and every colour come from drover-core/design/tokens.json (generated: theme-data.generated.ts and
// styles/themes.generated.css); this picks one and recolours the terminals.
// Order of precedence: this device's choice (localStorage) > `theme` in settings.toml > dark.
import type { ITerminalOptions, ITheme } from "@xterm/xterm";
import { TERM_THEMES, THEME_DEFS } from "./theme-data.generated";

/** [id, label] of every theme, then Auto. The list and all colours come from drover-core/design/tokens.json. */
export const THEMES: [string, string][] = [...THEME_DEFS.map((t): [string, string] => [t.id, t.label]), ["auto", "Auto (follow system)"]];

const TERM_COMMON = { cursorBlink: true };
const TERM: Record<string, ITheme> = TERM_THEMES;

const KEY = "drover-theme";
const listeners = new Set<() => void>();
let serverTheme = "dark";
let current = "dark";

function stored(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

function resolve(name: string): string {
  if (name === "auto") return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  return TERM[name] ? name : "dark";
}

/** Desktop app: tell the native window to match (the bridge may not be injected yet at first load; shown-event covers that). */
function syncTitleBar(): void {
  try { (window as any).pywebview?.api?.set_dark_title?.(current !== "light"); } catch { /* browser: no native title bar */ }
}

function apply(): void {
  current = resolve(stored() || serverTheme);
  document.documentElement.dataset.theme = current;
  syncTitleBar();
  listeners.forEach((fn) => fn());
}

/** The theme actually showing: "dark" | "light" | "midnight" (Auto is already resolved). */
export function activeTheme(): string { return current; }

/** xterm theme object for the active theme. */
export function termTheme(): ITheme { return { ...TERM[current] }; }
export function termOptions(): ITerminalOptions { return { ...TERM_COMMON, theme: termTheme() }; }

/** Called when terminals should be recoloured (theme changed). Returns an unsubscribe. */
export function onThemeChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** The user's choice on this device: "dark" | "light" | "midnight" | "auto". */
export function chosenTheme(): string { return stored() || serverTheme; }

export function setTheme(name: string): void {
  try { localStorage.setItem(KEY, name); } catch { /* private mode: applies for this session only */ }
  apply();
}

/** `theme` from settings.toml; only used while this device has no choice of its own. */
export function setServerTheme(name: unknown): void {
  if (typeof name === "string" && name !== serverTheme) { serverTheme = name; apply(); }
}

matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => { if (chosenTheme() === "auto") apply(); });
window.addEventListener("pywebviewready", syncTitleBar); // the bridge arrives after the first apply()
apply();
