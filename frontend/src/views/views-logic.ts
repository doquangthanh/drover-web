// Pure helpers of the alt views (inbox filtering, agent tree flattening, labels). No React, easy to unit test.
import type { Pane } from "../core/protocol-types";

/** Panes carry the agent that started them (`dr run`) as `parent`. */
export type AgentPane = Pane & { parent?: string };

export interface PolicyPending { id: string; source: string; target: string; text: string }

export type InboxFilter = "all" | "blocked" | "done" | "unread";

export const INBOX_GROUPS: [string, string[]][] = [
  ["Needs you", ["blocked"]], ["Done", ["done"]], ["Working", ["working"]], ["Idle · Exited", ["idle", "exited"]],
];

/** "" = every machine, "local" = this computer, otherwise a machine alias. */
export function inMachine(p: Pane, machine: string): boolean {
  return !machine || (machine === "local" ? !p.machine || p.machine === "local" : p.machine === machine);
}

export function matchesFilter(p: Pane, filter: InboxFilter): boolean {
  return filter === "all" || (filter === "blocked" && p.state === "blocked") || (filter === "done" && p.state === "done")
    || (filter === "unread" && !!p.unread);
}

/** "3d 4h", "2h 5m", "<1m": the two largest non-zero units. */
export function uptimeLabel(seconds: number): string {
  const up = Math.floor(seconds);
  const parts = [[Math.floor(up / 86400), "d"], [Math.floor((up % 86400) / 3600), "h"], [Math.floor((up % 3600) / 60), "m"]] as const;
  return parts.filter(([n]) => n).slice(0, 2).map(([n, u]) => n + u).join(" ") || "<1m";
}

/** Notification channel list ("Toast · Desktop"), "Off" when empty, "All" when every channel is on. */
export function channelLabel(v: unknown, all = false): string {
  if (!Array.isArray(v) || !v.length) return "Off";
  if (all && v.length >= 3) return "All";
  return v.map((x: string) => x[0].toUpperCase() + x.slice(1)).join(" · ");
}

/** `guides[i]`: the ancestor at depth i still has siblings below, so its connector line keeps going. */
export interface TreeRow { pane: AgentPane; guides: boolean[]; last: boolean }

/** Depth-first flattening for the connector-line tree. A helper whose parent was closed becomes a root. */
export function treeRows(panes: AgentPane[]): TreeRow[] {
  const ids = new Set(panes.map((p) => p.id));
  const isRoot = (p: AgentPane) => !p.parent || !ids.has(p.parent);
  const out: TreeRow[] = [];
  const seen = new Set<string>();
  const walk = (parent: string | null, guides: boolean[]) => {
    const kids = panes.filter((p) => !seen.has(p.id) && (parent === null ? isRoot(p) : p.parent === parent));
    kids.forEach((p, i) => {
      const last = i === kids.length - 1;
      seen.add(p.id);
      out.push({ pane: p, guides, last });
      walk(p.id, [...guides, !last]);
    });
  };
  walk(null, []);
  return out;
}

/** Rows whose name matches `query`, plus their ancestors so the tree shape stays readable. */
export function filterTreeRows(rows: TreeRow[], query: string): TreeRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  const byId = new Map(rows.map((r) => [r.pane.id, r.pane]));
  const keep = new Set<string>();
  for (const { pane } of rows) {
    if (!`${pane.name || ""} ${pane.title || ""}`.toLowerCase().includes(q)) continue;
    for (let p: AgentPane | undefined = pane; p && !keep.has(p.id); p = p.parent ? byId.get(p.parent) : undefined) keep.add(p.id);
  }
  return rows.filter((r) => keep.has(r.pane.id));
}

export const MESSAGE_VERB: Record<string, string> = {
  spawn: "started", wait: "is waiting for", send: "→", keys: "pressed keys in", read: "read", done: "finished for",
  blocked: "needs an answer — asked", denied: "tried to answer for",
};
