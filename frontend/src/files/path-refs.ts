// File references in terminal output ("src/core/keys.ts:41", "Update(src/a.tsx)", "C:\proj\a.py(12,3)"). Pure: no DOM, no store.

export interface PathRef { start: number; end: number; path: string; line?: number; col?: number }

const EXT = "ts|tsx|js|jsx|mjs|cjs|json|md|py|rs|go|toml|ya?ml|css|scss|html?|sh|sql|java|c|h|cpp|hpp|cs|php|rb|kt|swift|lua|ini|cfg|txt|xml|svg|lock|ps1|bat";
// Not preceded by a path/URL character (so "https://host/a.ts" is left to the URL handler); the extension must end the name.
const RE = new RegExp(
  String.raw`(?<![\w./\\:@~-])((?:[A-Za-z]:[\\/])?(?:[\w.@~-]+[\\/])*[\w@~-][\w.@~-]*\.(?:${EXT}))(?![\w])(?::(\d+)(?::(\d+))?|\((\d+)(?:,(\d+))?\))?`,
  "g",
);

/** Every file reference in one terminal line. `start`/`end` are string offsets (end exclusive) covering the :line:col suffix. */
export function findPathRefs(text: string): PathRef[] {
  const out: PathRef[] = [];
  for (const m of text.matchAll(RE)) {
    const line = m[2] ?? m[4], col = m[3] ?? m[5];
    out.push({ start: m.index!, end: m.index! + m[0].length, path: m[1], line: line ? Number(line) : undefined, col: col ? Number(col) : undefined });
  }
  return out;
}

/** Forward slashes, repeated ones folded, except the leading `//` of a UNC path (`\\server\share`). */
const slash = (p: string) => {
  const s = p.replace(/\\/g, "/");
  const unc = /^\/\/[^/]/.test(s);
  return (unc ? "/" : "") + s.replace(/\/{2,}/g, "/");
};
const isAbs = (p: string) => /^([A-Za-z]:)?\//.test(p);
/** Git Bash / MSYS spell `C:\x` as `/c/x`: turn that into `c:/x` so it compares with a drive-letter space. */
const msysToDrive = (p: string) => p.replace(/^\/([A-Za-z])(\/|$)/, "$1:/");
/** Lower-case ASCII only: keeps the length, so the original string can be sliced at the same index. */
const asciiLower = (s: string) => s.replace(/[A-Z]/g, (c) => c.toLowerCase());

/** Collapse "." and ".." segments of a slash-separated path. */
function collapse(p: string): string {
  const root = /^(\/\/|([A-Za-z]:)?\/)/.exec(p)?.[0] ?? "";
  const out: string[] = [];
  for (const seg of p.slice(root.length).split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") out.pop(); else out.push(seg);
  }
  return root + out.join("/");
}

/** Path of `ref` relative to the space folder (the form the Files view uses), or null when it is outside the space.
 * A relative reference is resolved against the pane's folder first. */
export function toSpacePath(ref: string, paneCwd: string | undefined, spaceCwd: string | undefined): string | null {
  if (!spaceCwd) return null;
  const space = collapse(slash(spaceCwd)).replace(/\/$/, "");
  const win = /^[A-Za-z]:/.test(space); // drive letters: paths compare case-insensitively
  const fix = (s: string) => (win ? msysToDrive(s) : s); // in a drive-letter space, Git Bash prints /c/x for C:\x
  const base = paneCwd ? collapse(fix(slash(paneCwd))) : space;
  const p = fix(slash(ref));
  const full = collapse(isAbs(p) ? p : `${base}/${p}`);
  const a = win ? asciiLower(full) : full, b = win ? asciiLower(space) : space;
  return a.startsWith(b + "/") ? full.slice(space.length + 1) : null;
}
