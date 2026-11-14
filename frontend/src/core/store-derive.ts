// Derived lists/indexes: local state + every machine snapshot, computed once per update (not per lookup).
import type { Machine, Pane, RawState, Snapshot, Space, StoppedPane, Tab } from "./protocol-types";

export type Counts = Record<string, number> & { blocked: number; done: number; working: number; idle: number; exited: number; unread: number };

export interface Derived {
  spaces: Space[];
  tabs: Tab[];
  panes: Pane[];
  stopped: StoppedPane[];
  paneById: Map<string, Pane>;
  tabById: Map<string, Tab>;
  spaceById: Map<string, Space>;
  counts: Counts;
}

export const EMPTY_RAW: RawState = { spaces: [], tabs: [], panes: [], stopped: [], machines: [], policy_pending: [] };

export function mergeAll<K extends keyof Snapshot>(raw: RawState, key: K): NonNullable<Snapshot[K]> {
  const out = [...(raw[key] || [])] as unknown[];
  for (const m of raw.machines || []) out.push(...(m.snapshot?.[key] || []));
  return out as NonNullable<Snapshot[K]>;
}

export function machineOf(raw: RawState, id: string | null | undefined): Machine | undefined {
  const s = String(id || "");
  const alias = s.includes(":") ? s.split(":")[0] : null;
  return alias ? (raw.machines || []).find((m) => m.alias === alias && m.snapshot) : undefined;
}

export function machineAlias(obj: { machine?: string } | null | undefined): string | null {
  return obj && obj.machine && obj.machine !== "local" ? obj.machine : null;
}

/** Return `prev` when `next` holds the exact same elements, so list selectors stay referentially stable. */
function stable<T>(prev: T[] | undefined, next: T[]): T[] {
  return prev && prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next;
}

function index<T extends { id: string }>(prevList: T[] | undefined, prevMap: Map<string, T> | undefined, list: T[]): Map<string, T> {
  return prevList === list && prevMap ? prevMap : new Map(list.map((x) => [x.id, x]));
}

export function computeCounts(panes: Pane[], prev?: Counts): Counts {
  const c: Counts = { blocked: 0, done: 0, working: 0, idle: 0, exited: 0, unread: 0 };
  for (const p of panes) { c[p.state] = (c[p.state] || 0) + 1; if (p.unread) c.unread++; }
  if (prev) {
    const keys = new Set([...Object.keys(c), ...Object.keys(prev)]);
    if ([...keys].every((k) => (c[k] || 0) === (prev[k] || 0))) return prev;
  }
  return c;
}

export function derive(raw: RawState, prev?: Derived): Derived {
  const spaces = stable(prev?.spaces, mergeAll(raw, "spaces"));
  const tabs = stable(prev?.tabs, mergeAll(raw, "tabs"));
  const panes = stable(prev?.panes, mergeAll(raw, "panes"));
  const stopped = stable(prev?.stopped, mergeAll(raw, "stopped"));
  return {
    spaces, tabs, panes, stopped,
    paneById: index(prev?.panes, prev?.paneById, panes),
    tabById: index(prev?.tabs, prev?.tabById, tabs),
    spaceById: index(prev?.spaces, prev?.spaceById, spaces),
    counts: computeCounts(panes, prev?.counts),
  };
}

export interface Selection { tabId: string | null; spaceId: string | null }

/** Keep the selected tab/space valid after the state changed (same rules as the vanilla store). */
export function fixSelection(d: Derived, sel: Selection): Selection {
  let tabId = sel.tabId;
  if (!tabId || !d.tabById.has(tabId)) {
    const sameSpace = d.tabs.find((t) => t.space_id === sel.spaceId);
    tabId = (sameSpace || d.tabs[0])?.id || null;
  }
  const tab = tabId ? d.tabById.get(tabId) : undefined;
  const spaceId = tab ? tab.space_id : (sel.spaceId && d.spaceById.has(sel.spaceId) ? sel.spaceId : d.spaces[0]?.id || null);
  return { tabId, spaceId };
}
