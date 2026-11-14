// Filtering for "Jump to a terminal" (pure).
import type { Pane, Space } from "../core/protocol-types";

export interface TextHit { pane: string; name: string; text: string }

export const MAX_AGENTS = 12;
export const MAX_SPACES = 6;
export const MAX_TEXT = 6;

export function matchAgents(panes: Pane[], q: string): Pane[] {
  const ql = q.toLowerCase();
  return panes.filter((p) => !q || (p.name || "").toLowerCase().includes(ql) || (p.kind || "").includes(ql)
    || (p.cwd || "").toLowerCase().includes(ql)).slice(0, MAX_AGENTS);
}

/** Spaces only show once the user typed something. */
export function matchSpaces(spaces: Space[], q: string): Space[] {
  const ql = q.toLowerCase();
  return spaces.filter((s) => q && ((s.name || "").toLowerCase().includes(ql) || (s.cwd || "").toLowerCase().includes(ql))).slice(0, MAX_SPACES);
}

/** Split `text` around the first case-insensitive match of `q`; null when nothing to highlight. */
export function splitHighlight(text: string, q: string): [string, string, string] | null {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  return i < 0 ? null : [text.slice(0, i), text.slice(i, i + q.length), text.slice(i + q.length)];
}
