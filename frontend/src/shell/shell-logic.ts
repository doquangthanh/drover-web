// Pure helpers behind the shell components (unit-tested).
import type { Pane } from "../core/protocol-types";

export const STATE_ORDER: Record<string, number> = { blocked: 0, done: 1, working: 2, idle: 3, exited: 4 };

export type SpaceIndicatorKind = "blocked" | "working" | "done" | null;

/** What the sidebar shows next to a space: the most urgent state among its agents. */
export function spaceIndicatorKind(panes: Pane[], spaceId: string): SpaceIndicatorKind {
  let working = false;
  let done = false;
  for (const p of panes) {
    if (p.space_id !== spaceId) continue;
    if (p.state === "blocked") return "blocked";
    if (p.state === "working") working = true;
    else if (p.state === "done") done = true;
  }
  return working ? "working" : done ? "done" : null;
}

/** Pane whose state a tab shows: its most urgent pane (blocked > done > working), so a helper that needs you is
 *  visible on the tab even when another pane has focus; with nothing urgent, the focused pane. */
export function tabStatePane(panes: Pane[], tabId: string, focused: Pane | undefined): Pane | undefined {
  const rank = (p: Pane | undefined) => STATE_ORDER[p?.state ?? ""] ?? 9;
  let best = focused;
  for (const p of panes) {
    if (p.tab_id === tabId && rank(p) <= STATE_ORDER.working && rank(p) < rank(best)) best = p;
  }
  return best;
}

/** Panes of one space, most urgent first (stable for equal states). */
export function sortedPanesOf(panes: Pane[], spaceId: string): Pane[] {
  return panes.filter((p) => p.space_id === spaceId).sort((a, b) => (STATE_ORDER[a.state] ?? 9) - (STATE_ORDER[b.state] ?? 9));
}

/** Status bar key hints for the view on screen: [key, what it does]. Only keys that really work there. */
export function viewHints(view: string): [string, string][] {
  switch (view) {
    case "workspace": return [["Ctrl+1–9", "pane"], ["Ctrl+\\", "split"], ["F8", "next agent"]];
    case "files": return [["Ctrl+S", "save"], ["Alt+S", "send to agent"], ["Ctrl+J", "agent panel"], ["Ctrl+Shift+G", "changes"]];
    case "changes": return [["F7", "next hunk"], ["A", "reviewed"], ["Ctrl+Shift+E", "files"]];
    default: return [];
  }
}

/** Phone navigation mode: "home" (agent list), "pane" (one terminal full screen) or "view" (any other view). */
export function mobileMode(view: string, mobilePane: string | null): "home" | "pane" | "view" {
  return view === "workspace" ? (mobilePane ? "pane" : "home") : "view";
}

export const machineDot = (status: string | undefined): "ok" | "bad" | "blocked" =>
  status === "connected" || status === "local" ? "ok" : status === "error" ? "bad" : "blocked";

/** Top bar titles of the full-page views: [title, hint]. `null` title means "current space name". */
export const VIEW_TITLES: Record<string, [string | null, string?]> = {
  inbox: ["Inbox"], machines: ["Machines", "reached over SSH · daemons never listen on the network"],
  settings: ["Settings"], tree: ["Agent tree", "who started whom · Ctrl+Shift+A"], server: ["drover-server"],
  files: ["Files"], changes: [null, "worktrees"], chat: ["Chat"],
};
