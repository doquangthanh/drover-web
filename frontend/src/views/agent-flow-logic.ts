// Pure helpers of the Agent tree Flow board: lanes, arrow geometry and activity bars built from `messages.list`.
// No React, easy to unit test. Percentages are of the lane area width; rows are indexes into the message list.
import type { PaneState } from "../core/protocol-types";
import type { AgentPane } from "./views-logic";

export interface AgentMessage { at: number; source?: string | null; target?: string | null; kind: string; text?: string }

/** Lane id of the user (or a CLI outside drover): messages with no source/target, or one outside the lanes, land here. */
export const YOU = "";

/** Short verbs for the arrow labels (the Messages tab keeps the longer MESSAGE_VERB sentences). */
export const FLOW_VERB: Record<string, string> = {
  spawn: "started", wait: "waits for", send: "sends", keys: "keys", read: "read", done: "finished",
  blocked: "asks", denied: "tried to answer", exited: "exited", "sub-start": "delegates", "sub-done": "returned",
};

/** Lane kind of a Claude Code sub-agent (Task/Agent tool); its id is `<pane>/<agent>` and it has no real pane. */
export const SUB_KIND = "sub";

/** Pseudo panes for the sub-agents in `messages` (one per "sub-start"): name = agent type, parent = its pane,
 *  done once "sub-done" arrived, otherwise working while its pane works (a closed or idle pane leaves it idle). */
export function subAgentPanes(messages: AgentMessage[], byId: Map<string, AgentPane>): AgentPane[] {
  const done = new Set(messages.filter((m) => m.kind === "sub-done").map((m) => m.source));
  const subs = new Map<string, AgentPane>();
  for (const m of messages) {
    if (m.kind !== "sub-start" || !m.target || !m.source || subs.has(m.target)) continue;
    const owner = byId.get(m.source)?.state;
    const state = done.has(m.target) ? "done" : owner === "working" || owner === "blocked" ? "working" : "idle";
    subs.set(m.target, { id: m.target, name: m.text || "agent", kind: SUB_KIND, state, parent: m.source, created_at: m.at });
  }
  return [...subs.values()];
}

/** Tree lanes with each pane's sub-agents right after it, in the order they started. */
export function withSubLanes(tree: string[], subs: AgentPane[]): string[] {
  return tree.flatMap((id) => [id, ...subs.filter((s) => s.parent === id).map((s) => s.id)]);
}

export interface FlowEvent {
  kind: string; verb: string; text: string; at: number; source: string; target: string;
  fromPct: number; leftPct: number; widthPct: number; midPct: number; toRight: boolean;
}

export interface ActivityBar { lane: number; startRow: number; endRow: number; live: boolean; state: PaneState }

export const hhmm = (at: number) => new Date(at * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Top-most ancestor that still exists (a closed parent makes its helper a root, like treeRows). */
export function rootOf(id: string, byId: Map<string, AgentPane>): string {
  const seen = new Set<string>();
  let cur = byId.get(id);
  while (cur?.parent && byId.has(cur.parent) && !seen.has(cur.id)) {
    seen.add(cur.id);
    cur = byId.get(cur.parent);
  }
  return cur?.id ?? id;
}

/** The pane and all its helpers, depth first (same order as the tree). */
export function subtreeIds(rootId: string, panes: AgentPane[]): string[] {
  const out: string[] = [];
  const walk = (id: string) => {
    if (out.includes(id)) return;
    out.push(id);
    panes.filter((p) => p.parent === id).forEach((p) => walk(p.id));
  };
  walk(rootId);
  return out;
}

export const laneCenter = (i: number, n: number) => ((i + 0.5) / n) * 100;

/** One arrow per message, from the source lane to the target lane. An agent outside the lanes is drawn on the
 *  "you" lane but keeps its real id in `source` / `target`, so labels and dimming still name it. */
export function buildFlowEvents(messages: AgentMessage[], laneIds: string[]): FlowEvent[] {
  const n = laneIds.length;
  const lane = (id?: string | null) => Math.max(0, laneIds.indexOf(id || YOU));
  return messages.map((m) => {
    const a = lane(m.source), b = lane(m.target);
    const lo = laneCenter(Math.min(a, b), n), hi = laneCenter(Math.max(a, b), n);
    return {
      kind: m.kind, verb: FLOW_VERB[m.kind] || m.kind, text: m.text || "", at: m.at,
      source: m.source || YOU, target: m.target || YOU, fromPct: laneCenter(a, n), leftPct: lo, widthPct: hi - lo,
      midPct: (lo + hi) / 2, toRight: b > a,
    };
  });
}

/** When each agent was active: from the row that started it to its last "done" / "exited" (to the end while it runs). */
export function activityBars(messages: AgentMessage[], laneIds: string[], byId: Map<string, AgentPane>): ActivityBar[] {
  const last = messages.length - 1;
  const bars: ActivityBar[] = [];
  laneIds.forEach((id, lane) => {
    const pane = byId.get(id);
    if (!pane) return;
    let startRow = messages.findIndex((m) => m.kind === "spawn" && m.target === id);
    if (startRow < 0) startRow = messages.findIndex((m) => m.source === id || m.target === id);
    if (startRow < 0) return;
    // No "done" / "exited" row (evicted, or an older daemon): the bar ends at the agent's last mention.
    let endRow = -1, lastMention = startRow;
    messages.forEach((m, i) => {
      if ((m.kind === "done" || m.kind === "exited") && m.source === id) endRow = i;
      if (m.source === id || m.target === id) lastMention = i;
    });
    const live = pane.state === "working" || pane.state === "blocked";
    if (live) endRow = last;
    else if (endRow < startRow) endRow = lastMention;
    bars.push({ lane, startRow, endRow, live, state: pane.state });
  });
  return bars;
}

export function stateCounts(panes: AgentPane[]): Record<PaneState, number> {
  const out = { working: 0, blocked: 0, done: 0, idle: 0, exited: 0 } as Record<PaneState, number>;
  for (const p of panes) out[p.state] = (out[p.state] || 0) + 1;
  return out;
}

export const touches = (m: Pick<AgentMessage, "source" | "target">, ids: Set<string>) =>
  ids.has(m.source || YOU) || ids.has(m.target || YOU);
