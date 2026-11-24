// `#files?space=<id>&file=src/a.ts&line=41&col=7`: how the native window (and links) point at a file (pure).

export interface FileHash { space: string; file: string; line?: number; col?: number }

/** The target of a location hash, or null when it is not a file link. `hash` may start with "#". */
export function parseFileHash(hash: string): FileHash | null {
  const h = hash.replace(/^#/, "");
  const q = h.indexOf("?");
  if (q < 0 || h.slice(0, q) !== "files") return null;
  const p = new URLSearchParams(h.slice(q + 1));
  const space = p.get("space"), file = p.get("file");
  if (!space || !file || file.startsWith("/") || file.split("/").includes("..")) return null;
  const num = (k: string) => { const n = Number(p.get(k)); return Number.isInteger(n) && n > 0 ? n : undefined; };
  return { space, file, line: num("line"), col: num("col") };
}
