// Themes: colours live in css/themes.css; this picks one and recolours the terminals.
// Order of precedence: this device's choice (localStorage) > `theme` in settings.toml > dark.
import type { ITerminalOptions, ITheme } from "@xterm/xterm";

export const THEMES: [string, string][] = [
  ["dark", "Dark"], ["light", "Light"], ["midnight", "Midnight"], ["auto", "Auto (follow system)"],
];

const TERM_COMMON = { cursorBlink: true };
const TERM: Record<string, ITheme> = {
  dark: {
    background: "#17191d", foreground: "#d2d4d9", cursor: "#d2d4d9", cursorAccent: "#17191d",
    selectionBackground: "rgba(150,178,215,.32)",
    black: "#2c2e31", red: "#dc8c95", green: "#a6bd91", yellow: "#d8be87", blue: "#96b2d7",
    magenta: "#b5a2ce", cyan: "#8cbdc3", white: "#d2d4d9",
    brightBlack: "#818793", brightRed: "#e8a1a9", brightGreen: "#b9cfa5", brightYellow: "#e6cf9c",
    brightBlue: "#aec5e4", brightMagenta: "#c8b7de", brightCyan: "#a3cfd4", brightWhite: "#f0f0f2",
  },
  light: {
    background: "#ffffff", foreground: "#2b2f36", cursor: "#2b2f36", cursorAccent: "#ffffff",
    selectionBackground: "rgba(47,107,179,.25)",
    black: "#2b2f36", red: "#c0343f", green: "#1a7f4b", yellow: "#946200", blue: "#2f6bb3",
    magenta: "#8a4fb0", cyan: "#177f88", white: "#8a909c",
    brightBlack: "#5b6270", brightRed: "#d9505b", brightGreen: "#22a062", brightYellow: "#b57a00",
    brightBlue: "#4a86d0", brightMagenta: "#a468cc", brightCyan: "#2299a4", brightWhite: "#1a1c20",
  },
  midnight: {
    background: "#0f1320", foreground: "#cdd3e8", cursor: "#cdd3e8", cursorAccent: "#0f1320",
    selectionBackground: "rgba(124,156,255,.3)",
    black: "#1f2538", red: "#f08a97", green: "#8fd3a8", yellow: "#ffcf8a", blue: "#7c9cff",
    magenta: "#c3a6ff", cyan: "#7fd6e3", white: "#cdd3e8",
    brightBlack: "#6b7494", brightRed: "#ff9aa6", brightGreen: "#a6e6bd", brightYellow: "#ffdca8",
    brightBlue: "#9cb5ff", brightMagenta: "#d4bdff", brightCyan: "#9fe6f0", brightWhite: "#f2f4fc",
  },
};

const KEY = "herd-theme";
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

function apply(): void {
  current = resolve(stored() || serverTheme);
  document.documentElement.dataset.theme = current;
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
apply();
