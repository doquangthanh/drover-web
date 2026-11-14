// Pure helpers of the alt views (inbox filtering, agent tree flattening, labels). No React, easy to unit test.
import type { Pane } from "../core/protocol-types";

/** Panes carry the agent that started them (`hd run`) as `parent`. */
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

export interface TreeRow { pane: AgentPane; prefix: string }

/** Depth-first flattening with box-drawing prefixes. A helper whose parent was closed becomes a root. */
export function treeRows(panes: AgentPane[]): TreeRow[] {
  const ids = new Set(panes.map((p) => p.id));
  const isRoot = (p: AgentPane) => !p.parent || !ids.has(p.parent);
  const out: TreeRow[] = [];
  const walk = (parent: string | null, indent: string) => {
    const kids = panes.filter((p) => (parent === null ? isRoot(p) : p.parent === parent));
    kids.forEach((p, i) => {
      const last = i === kids.length - 1;
      out.push({ pane: p, prefix: indent + (last ? "└ " : "├ ") });
      walk(p.id, indent + (last ? "   " : "│  "));
    });
  };
  walk(null, "");
  return out;
}

export const MESSAGE_VERB: Record<string, string> = {
  spawn: "started", wait: "is waiting for", send: "→", read: "read", done: "finished for",
  blocked: "needs an answer — asked", denied: "tried to answer for",
};
