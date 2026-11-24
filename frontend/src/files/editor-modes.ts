// File name -> Ace mode, app theme -> Ace theme file. Pure, no Ace needed.
const MODE_BY_EXT: Record<string, string> = {
  py: "python", js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "jsx", ts: "typescript", tsx: "tsx",
  json: "json", html: "html", htm: "html", css: "css", scss: "scss", md: "markdown", markdown: "markdown",
  yml: "yaml", yaml: "yaml", toml: "toml", sh: "sh", bash: "sh", zsh: "sh", ps1: "powershell", bat: "batchfile",
  cmd: "batchfile", sql: "sql", xml: "xml", svg: "svg", java: "java", c: "c_cpp", h: "c_cpp", cpp: "c_cpp",
  hpp: "c_cpp", cs: "csharp", go: "golang", rs: "rust", php: "php", rb: "ruby", ini: "ini", cfg: "ini",
  diff: "diff", patch: "diff", kt: "kotlin", swift: "swift", lua: "lua",
};
const THEME_FILE: Record<string, string> = {
  dark: "tomorrow_night", midnight: "tomorrow_night_blue", light: "github", dracula: "dracula", "tokyo-night": "tokyo_night",
  nord: "nord", catppuccin: "catppuccin", "one-dark": "one_dark", gruvbox: "gruvbox",
};

export function modeFor(path: string): string {
  const name = (path.split("/").pop() || "").toLowerCase();
  if (name === "dockerfile") return "dockerfile";
  return MODE_BY_EXT[name.includes(".") ? name.split(".").pop()! : ""] || "text";
}

export const aceThemeFor = (appTheme: string): string => `ace/theme/${THEME_FILE[appTheme] || THEME_FILE.dark}`;
