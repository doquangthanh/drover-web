// Your own shortcuts for the web UI: a `[web_keys]` table in keys.toml (Settings → Keyboard), like `[desktop_keys]` in the app.
//
//   [web_keys]
//   search = "ctrl+e"                  # jump to a terminal (its default Ctrl+P stops working)
//   nextBlocked = ["f8", "ctrl+j"]     # several chords for one action
//
// Chords are lower case, modifiers first: ctrl, alt, shift, meta. Pure: no DOM, no store (unit-tested).

export interface WebKeys {
  /** chord -> action id */
  byChord: Map<string, string>;
  /** actions that have a custom chord: their built-in chord is switched off */
  overridden: Set<string>;
  problems: string[];
}

export const NO_WEB_KEYS: WebKeys = { byChord: new Map(), overridden: new Set(), problems: [] };

const MOD_ALIAS: Record<string, string> = { ctrl: "ctrl", control: "ctrl", alt: "alt", option: "alt", shift: "shift", meta: "meta", cmd: "meta", win: "meta" };
const KEY_ALIAS: Record<string, string> = { esc: "escape", return: "enter", pgup: "pageup", pgdn: "pagedown", del: "delete", " ": "space" };
const ORDER = ["ctrl", "alt", "shift", "meta"];

const canonical = (mods: Set<string>, key: string): string => [...ORDER.filter((m) => mods.has(m)), key].join("+");

/** "Ctrl+Shift+P" -> "ctrl+shift+p"; null when it is not a chord. */
export function normalizeChord(spec: string): string | null {
  const parts = spec.trim().toLowerCase().split("+").map((p) => p.trim());
  const rawKey = parts.pop();
  if (!rawKey) return null;
  const mods = new Set<string>();
  for (const p of parts) {
    const m = MOD_ALIAS[p];
    if (!m || mods.has(m)) return null;
    mods.add(m);
  }
  const key = KEY_ALIAS[rawKey] ?? rawKey;
  if (!mods.size && !/^f\d{1,2}$/.test(key)) return null; // a bare letter would steal typing
  return canonical(mods, key);
}

/** The slice of KeyboardEvent a chord is read from. */
export interface ChordEvent { key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; metaKey?: boolean }

export function chordOfEvent(ev: ChordEvent): string {
  const mods = new Set<string>();
  if (ev.ctrlKey) mods.add("ctrl");
  if (ev.altKey) mods.add("alt");
  if (ev.shiftKey) mods.add("shift");
  if (ev.metaKey) mods.add("meta");
  const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key.toLowerCase();
  return canonical(mods, KEY_ALIAS[k] ?? k);
}

const ARROWS: Record<string, string> = { arrowleft: "←", arrowright: "→", arrowup: "↑", arrowdown: "↓" };

/** "ctrl+shift+p" -> "Ctrl+Shift+P", the way the shortcut sheet and the palette show keys. */
export function displayChord(chord: string): string {
  return chord.split("+").map((p) => ARROWS[p] ?? (/^f\d{1,2}$/.test(p) || p.length === 1 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1))).join("+");
}

/** The first custom chord of an action, formatted; undefined when it has none. */
export function customKeysFor(wk: WebKeys, action: string): string | undefined {
  for (const [chord, id] of wk.byChord) if (id === action) return displayChord(chord);
  return undefined;
}

/** Custom chords that take over a built-in chord of another action, e.g. "ctrl+b was toggleSidebar, now search". */
export function shadowedBuiltins(wk: WebKeys, builtins: ReadonlyMap<string, string>): string[] {
  const out: string[] = [];
  for (const [chord, id] of wk.byChord) {
    const was = builtins.get(chord);
    if (was && was !== id && !wk.overridden.has(was)) out.push(`${displayChord(chord)} used to be "${was}"; now it runs "${id}", and "${was}" has no key until you give it one`);
  }
  return out;
}

const RESERVED = new Set(["ctrl+k"]); // starts every two-step chord

/** Read the `[web_keys]` table out of keys.toml text. `known`: the action ids that exist. */
export function parseWebKeys(text: string, known: ReadonlySet<string>): WebKeys {
  const out: WebKeys = { byChord: new Map(), overridden: new Set(), problems: [] };
  let inTable = false;
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const head = /^\[([^\]]+)\]/.exec(t);
    if (head) { inTable = head[1].trim() === "web_keys"; continue; }
    if (!inTable) continue;
    const kv = /^"?([\w.-]+)"?\s*=\s*(.+)$/.exec(t);
    if (!kv) { out.problems.push(`web_keys: cannot read "${t}"`); continue; }
    const [, id, rest] = kv;
    if (!known.has(id)) { out.problems.push(`web_keys: no action called "${id}"`); continue; }
    const specs = [...rest.replace(/\s#.*$/, "").matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    if (!specs.length) { out.problems.push(`web_keys: "${id}" needs a chord in quotes, like "ctrl+e"`); continue; }
    for (const spec of specs) {
      const chord = normalizeChord(spec);
      if (!chord) { out.problems.push(`web_keys: "${spec}" is not a shortcut (like "ctrl+alt+t")`); continue; }
      if (RESERVED.has(chord)) { out.problems.push(`web_keys: ${chord} starts the Ctrl+K chords and cannot be changed`); continue; }
      const taken = out.byChord.get(chord);
      if (taken && taken !== id) out.problems.push(`web_keys: ${chord} is used by both "${taken}" and "${id}"; "${id}" wins`);
      out.byChord.set(chord, id);
      out.overridden.add(id);
    }
  }
  return out;
}
