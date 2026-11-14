// File-tree icons. Choose a set in Settings (or `file_icons` in settings.toml):
//   material = Material Icon Theme (colourful, per file type / folder name)   badge = coloured text labels
//   line     = one-colour outline icons that follow the theme                 none  = just the folder arrows
// Precedence: this device's choice (localStorage) > settings.toml > "material".
// Logic only: `fileIconSpec` describes what to draw; the React component renders it (phase 7).

export const ICON_SETS: [string, string, string][] = [
  ["material", "Material", "Colourful icons per file type and folder name (like VS Code)"],
  ["badge", "Badges", "Small coloured labels: PY, JS, MD…"],
  ["line", "Line", "One colour, follows the theme"],
  ["none", "None", "Only the folder arrows"],
];

interface MaterialTable {
  folders: Record<string, string>; folder: string; folderOpen: string; openOf: Record<string, string>;
  names: Record<string, string>; ext: Record<string, string>; file: string;
}

export type FileIconSpec =
  | { type: "none" }
  | { type: "svg"; body: string }           // trusted static path markup, 24x24 viewBox, stroke 1.7
  | { type: "img"; src: string }
  | { type: "badge"; label: string; background: string };

const KEY = "herd-file-icons";
const listeners = new Set<() => void>();
let serverSet = "material";
let table: MaterialTable | null = null; // Material lookup, loaded on first use
let loading = false;

const stored = (): string | null => { try { return localStorage.getItem(KEY); } catch { return null; } };
export function chosenIconSet(): string { const s = stored() || serverSet; return ICON_SETS.some(([id]) => id === s) ? s : "material"; }
export function onIconSetChange(fn: () => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }
const notify = () => listeners.forEach((fn) => fn());

export function setIconSet(name: string): void {
  try { localStorage.setItem(KEY, name); } catch { /* private mode: this session only */ }
  notify();
}
export function setServerIconSet(name: unknown): void {
  if (typeof name === "string" && name !== serverSet) { serverSet = name; notify(); }
}

function loadTable(): void {
  if (table || loading) return;
  loading = true;
  fetch("/static/icons/material/map.json").then((r) => r.json()).then((t: MaterialTable) => { table = t; notify(); }).catch(() => { loading = false; });
}

export function materialName(t: MaterialTable, name: string, dir: boolean, open: boolean): string {
  const lower = name.toLowerCase();
  if (dir) {
    const closed = t.folders[lower] || t.folder;
    return open ? (t.openOf[closed] || t.folderOpen) : closed;
  }
  if (t.names[lower]) return t.names[lower];
  const parts = lower.split(".");
  for (let i = 1; i < parts.length; i++) { const hit = t.ext[parts.slice(i).join(".")]; if (hit) return hit; } // "a.test.ts" -> "test.ts" -> "ts"
  return t.file;
}

const FILE = '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>';
const LINE: Record<string, string> = {
  folder: '<path d="M3 7h6l2 2h10v10H3z"/>', open: '<path d="M3 7h6l2 2h8v3"/><path d="M3 19l3-7h16l-3 7z"/>',
  code: FILE + '<path d="M10 13l-2 2 2 2M14 13l2 2-2 2"/>', text: FILE + '<path d="M9 12h6M9 15h6M9 18h4"/>',
  image: FILE + '<path d="M8 18l3-3 2 2 2-2 1 1"/>', data: FILE + '<path d="M9 13h6M9 17h6"/>', file: FILE,
};
const KIND: Record<string, string> = {
  code: "py js mjs cjs jsx ts tsx java c h cpp hpp cs go rs php rb kt swift lua sh bash ps1 bat sql html css scss xml svg",
  text: "md markdown txt rst log", image: "png jpg jpeg gif webp ico bmp", data: "json yaml yml toml ini cfg env lock csv",
};
const kindOf = (ext: string) => Object.keys(KIND).find((k) => KIND[k].split(" ").includes(ext)) || "file";

const BADGE_COLORS: Record<string, string> = { py: "#3572a5", js: "#c9a800", ts: "#3178c6", tsx: "#3178c6", jsx: "#c9a800", json: "#8a8f98", md: "#519aba",
  html: "#e34c26", css: "#563d7c", yml: "#cb171e", yaml: "#cb171e", toml: "#9c4221", sh: "#4eaa25", sql: "#e38c00", go: "#00add8", rs: "#b7410e" };
const PALETTE = ["#d97757", "#5b8def", "#8f7ce0", "#4cc48c", "#e0a030", "#d6578c", "#3fa7a7", "#7d8590"];

export function badgeSpec(name: string): FileIconSpec {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  const label = (ext || name.slice(0, 2)).slice(0, 3).toUpperCase();
  let hash = 0;
  for (const ch of ext || name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return { type: "badge", label, background: BADGE_COLORS[ext] || PALETTE[hash % PALETTE.length] };
}

/** What to draw for a tree row. `open` only matters for folders. */
export function fileIconSpec(name: string, dir = false, open = false, set = chosenIconSet()): FileIconSpec {
  if (set === "none") return { type: "none" };
  if (set === "material") {
    loadTable();
    if (!table) return { type: "svg", body: LINE[dir ? "folder" : "file"] }; // brief placeholder while the lookup loads
    return { type: "img", src: `/static/icons/material/${materialName(table, name, dir, open)}.svg` };
  }
  if (set === "badge") return dir ? { type: "svg", body: LINE[open ? "open" : "folder"] } : badgeSpec(name);
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  return { type: "svg", body: dir ? LINE[open ? "open" : "folder"] : LINE[kindOf(ext)] };
}
