// Toast when a workspace appears that this UI did not open on purpose, e.g. an agent spawned from the CLI in a new folder.
import type { RawState, Space } from "./protocol-types";

/** Space ids per source: "" for this computer, the alias for a remote machine. */
export type KnownSpaces = Map<string, Set<string>>;

/** Spaces in `raw` that are new for a source already seen before. A machine seen for the first time
 *  (startup, reconnect) only records its spaces: those were not just created. */
export function diffNewSpaces(known: KnownSpaces | null, raw: RawState): { added: Space[]; next: KnownSpaces } {
  const next: KnownSpaces = new Map();
  const added: Space[] = [];
  const sources: [string, Space[] | undefined][] = [["", raw.spaces]];
  for (const m of raw.machines || []) if (m.snapshot) sources.push([m.alias, m.snapshot.spaces]);
  for (const [source, spaces] of sources) {
    const prev = known?.get(source);
    next.set(source, new Set((spaces || []).map((s) => s.id)));
    if (prev) for (const s of spaces || []) if (!prev.has(s.id)) added.push(s);
  }
  return { added, next };
}

let known: KnownSpaces | null = null;
let expectedUntil = 0;

/** Call right before the UI itself opens a workspace, so that one does not raise a toast. */
export function expectNewWorkspace(ms = 10_000): void { expectedUntil = Date.now() + ms; }

/** Feed every state snapshot; returns the spaces worth a toast. */
export function takeUnexpectedSpaces(raw: RawState): Space[] {
  const { added, next } = diffNewSpaces(known, raw);
  known = next;
  if (!added.length || Date.now() < expectedUntil) return [];
  return added;
}
