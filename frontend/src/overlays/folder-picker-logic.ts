// Pure helpers for the in-app folder picker.
import type { Space } from "../core/protocol-types";

export interface DirEntry { name: string; path: string; is_git?: boolean; mtime?: number }
export interface DirListing { path: string; parent?: string | null; roots: string[]; entries: DirEntry[] }

/** Last path segment ("/a/b/" -> "b"); falls back to the whole path. */
export const baseName = (p: string): string => String(p).replace(/[\\/]+$/, "").split(/[\\/]/).pop() || p;

/** Folder age as the picker shows it: today / yesterday / N days ago / N weeks ago / N months ago. */
export function folderAge(ts: number, nowMs: number = Date.now()): string {
  const d = Math.floor((nowMs / 1000 - ts) / 86400);
  if (d < 1) return "today";
  if (d < 7) return d === 1 ? "yesterday" : `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)} week${d >= 14 ? "s" : ""} ago`;
  return `${Math.floor(d / 30)} month${d >= 60 ? "s" : ""} ago`;
}

/** Breadcrumb as [directory prefix, current folder name]. */
export function splitCrumb(path: string): [string, string] {
  const cut = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return [path.slice(0, cut + 1) + (cut >= 0 && cut < path.length - 1 ? " " : ""), path.slice(cut + 1)];
}

export function filterEntries(entries: DirEntry[], filter: string): DirEntry[] {
  const f = filter.toLowerCase();
  return entries.filter((e) => !f || e.name.toLowerCase().includes(f));
}

/** Distinct space folders on one machine (null = this computer), newest first as listed. */
export function recentFolders(spaces: Space[], machine: string | null, limit = 6): string[] {
  const on = spaces.filter((s) => (s.machine && s.machine !== "local" ? s.machine : null) === (machine || null));
  return [...new Set(on.map((s) => s.cwd).filter((c): c is string => !!c))].slice(0, limit);
}
