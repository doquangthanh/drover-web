// GENERATED from drover-core/design/tokens.json by design/gen-tokens.mjs. Do not edit: change tokens.json and run the generator.
import type { ITheme } from "@xterm/xterm";

export interface ThemeDef { id: string; label: string; note: string; scheme: "dark" | "light" }
export const THEME_DEFS: ThemeDef[] = [
  { id: "dark", label: "Dark", note: "default", scheme: "dark" },
  { id: "light", label: "Light", note: "", scheme: "light" },
  { id: "midnight", label: "Midnight", note: "", scheme: "dark" },
  { id: "dracula", label: "Dracula", note: "", scheme: "dark" },
  { id: "tokyo-night", label: "Tokyo Night", note: "", scheme: "dark" },
  { id: "nord", label: "Nord", note: "", scheme: "dark" },
  { id: "catppuccin", label: "Catppuccin", note: "", scheme: "dark" },
  { id: "one-dark", label: "One Dark", note: "", scheme: "dark" },
  { id: "gruvbox", label: "Gruvbox", note: "", scheme: "dark" },
];

export const TERM_THEMES: Record<string, ITheme> = {
  "dark": {
    background: "#17191d", foreground: "#d2d4d9", cursor: "#d2d4d9", cursorAccent: "#17191d",
    selectionBackground: "rgba(150,178,215,.32)",
    black: "#2c2e31", red: "#dc8c95", green: "#a6bd91", yellow: "#d8be87", blue: "#96b2d7", magenta: "#b5a2ce", cyan: "#8cbdc3", white: "#d2d4d9",
    brightBlack: "#818793", brightRed: "#e8a1a9", brightGreen: "#b9cfa5", brightYellow: "#e6cf9c", brightBlue: "#aec5e4", brightMagenta: "#c8b7de", brightCyan: "#a3cfd4", brightWhite: "#f0f0f2",
  },
  "light": {
    background: "#ffffff", foreground: "#2b2f36", cursor: "#2b2f36", cursorAccent: "#ffffff",
    selectionBackground: "rgba(47,107,179,.25)",
    black: "#2b2f36", red: "#c0343f", green: "#1a7f4b", yellow: "#946200", blue: "#2f6bb3", magenta: "#8a4fb0", cyan: "#177f88", white: "#8a909c",
    brightBlack: "#5b6270", brightRed: "#d9505b", brightGreen: "#22a062", brightYellow: "#b57a00", brightBlue: "#4a86d0", brightMagenta: "#a468cc", brightCyan: "#2299a4", brightWhite: "#1a1c20",
  },
  "midnight": {
    background: "#0f1320", foreground: "#cdd3e8", cursor: "#cdd3e8", cursorAccent: "#0f1320",
    selectionBackground: "rgba(124,156,255,.3)",
    black: "#1f2538", red: "#f08a97", green: "#8fd3a8", yellow: "#ffcf8a", blue: "#7c9cff", magenta: "#c3a6ff", cyan: "#7fd6e3", white: "#cdd3e8",
    brightBlack: "#6b7494", brightRed: "#ff9aa6", brightGreen: "#a6e6bd", brightYellow: "#ffdca8", brightBlue: "#9cb5ff", brightMagenta: "#d4bdff", brightCyan: "#9fe6f0", brightWhite: "#f2f4fc",
  },
  "dracula": {
    background: "#282a36", foreground: "#e2e3ee", cursor: "#f8f8f2", cursorAccent: "#282a36",
    selectionBackground: "rgba(189,147,249,.3)",
    black: "#21222c", red: "#ff5555", green: "#50fa7b", yellow: "#f1fa8c", blue: "#bd93f9", magenta: "#ff79c6", cyan: "#8be9fd", white: "#f8f8f2",
    brightBlack: "#6272a4", brightRed: "#ff6e6e", brightGreen: "#69ff94", brightYellow: "#ffffa5", brightBlue: "#d6acff", brightMagenta: "#ff92df", brightCyan: "#a4ffff", brightWhite: "#ffffff",
  },
  "tokyo-night": {
    background: "#1a1b26", foreground: "#b0baea", cursor: "#c0caf5", cursorAccent: "#1a1b26",
    selectionBackground: "rgba(122,162,247,.3)",
    black: "#15161e", red: "#f7768e", green: "#9ece6a", yellow: "#e0af68", blue: "#7aa2f7", magenta: "#bb9af7", cyan: "#7dcfff", white: "#a9b1d6",
    brightBlack: "#565f89", brightRed: "#f7768e", brightGreen: "#9ece6a", brightYellow: "#e0af68", brightBlue: "#7aa2f7", brightMagenta: "#bb9af7", brightCyan: "#7dcfff", brightWhite: "#c0caf5",
  },
  "nord": {
    background: "#2e3440", foreground: "#d8dee9", cursor: "#d8dee9", cursorAccent: "#2e3440",
    selectionBackground: "rgba(136,192,208,.3)",
    black: "#3b4252", red: "#bf616a", green: "#a3be8c", yellow: "#ebcb8b", blue: "#81a1c1", magenta: "#b48ead", cyan: "#88c0d0", white: "#e5e9f0",
    brightBlack: "#6b778c", brightRed: "#d08770", brightGreen: "#b4cf9d", brightYellow: "#f0d9a5", brightBlue: "#8fb3d6", brightMagenta: "#c4a0be", brightCyan: "#8fbcbb", brightWhite: "#eceff4",
  },
  "catppuccin": {
    background: "#1e1e2e", foreground: "#bac2de", cursor: "#f5e0dc", cursorAccent: "#1e1e2e",
    selectionBackground: "rgba(203,166,247,.3)",
    black: "#45475a", red: "#f38ba8", green: "#a6e3a1", yellow: "#f9e2af", blue: "#89b4fa", magenta: "#f5c2e7", cyan: "#94e2d5", white: "#bac2de",
    brightBlack: "#7f849c", brightRed: "#f38ba8", brightGreen: "#a6e3a1", brightYellow: "#f9e2af", brightBlue: "#89b4fa", brightMagenta: "#f5c2e7", brightCyan: "#94e2d5", brightWhite: "#cdd6f4",
  },
  "one-dark": {
    background: "#282c34", foreground: "#abb2bf", cursor: "#528bff", cursorAccent: "#282c34",
    selectionBackground: "rgba(97,175,239,.3)",
    black: "#3f4451", red: "#e06c75", green: "#98c379", yellow: "#e5c07b", blue: "#61afef", magenta: "#c678dd", cyan: "#56b6c2", white: "#abb2bf",
    brightBlack: "#7a8394", brightRed: "#e88a92", brightGreen: "#aed394", brightYellow: "#edd09a", brightBlue: "#82c0f2", brightMagenta: "#d298e4", brightCyan: "#78c8d2", brightWhite: "#e6e9ef",
  },
  "gruvbox": {
    background: "#282828", foreground: "#d5c4a1", cursor: "#ebdbb2", cursorAccent: "#282828",
    selectionBackground: "rgba(250,189,47,.28)",
    black: "#3c3836", red: "#fb4934", green: "#b8bb26", yellow: "#fabd2f", blue: "#83a598", magenta: "#d3869b", cyan: "#8ec07c", white: "#d5c4a1",
    brightBlack: "#928374", brightRed: "#fb6a58", brightGreen: "#cbce4f", brightYellow: "#fcd160", brightBlue: "#9cb8ab", brightMagenta: "#dc9fae", brightCyan: "#a3cd94", brightWhite: "#fbf1c7",
  },
};

export interface ThemePreview { cv: string; ch: string; cp: string; fg: string; mu: string; ac: string; bd: string; ok: string }
export const THEME_PREVIEW: Record<string, ThemePreview> = {
  "dark": { cv: "#131518", ch: "#101114", cp: "#17191d", fg: "#eeeeef", mu: "#98999b", ac: "#96b2d7", bd: "rgba(255,255,255,.1)", ok: "#a6bd91" },
  "light": { cv: "#eef0f3", ch: "#e4e7eb", cp: "#ffffff", fg: "#1a1c20", mu: "#5b6270", ac: "#2f6bb3", bd: "rgba(0,0,0,.1)", ok: "#1a7f4b" },
  "midnight": { cv: "#0b0e17", ch: "#080a12", cp: "#0f1320", fg: "#e6e9f5", mu: "#8e97b5", ac: "#7c9cff", bd: "rgba(255,255,255,.1)", ok: "#8fd3a8" },
  "dracula": { cv: "#1e1f29", ch: "#191a21", cp: "#282a36", fg: "#f8f8f2", mu: "#a9aec9", ac: "#bd93f9", bd: "rgba(255,255,255,.1)", ok: "#50fa7b" },
  "tokyo-night": { cv: "#16161e", ch: "#13131a", cp: "#1a1b26", fg: "#c0caf5", mu: "#9aa5ce", ac: "#7aa2f7", bd: "rgba(255,255,255,.1)", ok: "#9ece6a" },
  "nord": { cv: "#272c36", ch: "#242933", cp: "#2e3440", fg: "#eceff4", mu: "#a5b0c5", ac: "#88c0d0", bd: "rgba(255,255,255,.1)", ok: "#a3be8c" },
  "catppuccin": { cv: "#181825", ch: "#11111b", cp: "#1e1e2e", fg: "#cdd6f4", mu: "#a6adc8", ac: "#cba6f7", bd: "rgba(255,255,255,.1)", ok: "#a6e3a1" },
  "one-dark": { cv: "#21252b", ch: "#1b1f23", cp: "#282c34", fg: "#e6e9ef", mu: "#9aa1ae", ac: "#61afef", bd: "rgba(255,255,255,.1)", ok: "#98c379" },
  "gruvbox": { cv: "#1d2021", ch: "#181a1b", cp: "#282828", fg: "#ebdbb2", mu: "#bdae93", ac: "#fabd2f", bd: "rgba(255,255,255,.1)", ok: "#b8bb26" },
};
