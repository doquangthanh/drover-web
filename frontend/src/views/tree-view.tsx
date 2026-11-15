// Agent tree: who started whom (left), the selected agent and its tree's state (top right), and what they did to each
// other (dr run / wait / send / read) as a live Flow board, a Messages list or the orchestration Policy.
import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { conn } from "../core/connection";
import { useStore } from "../core/store";
import { errorToast } from "../core/toast-store";
import { clearTopExtra, setTopExtra } from "../shell/top-extra-store";
import { useMessagesTick } from "../core/agent-messages-tick";
import { hhmm, rootOf, subAgentPanes, subtreeIds, touches, withSubLanes, YOU, type AgentMessage } from "./agent-flow-logic";
import { AgentFlowBoard } from "./agent-flow-board";
import { AgentTreeInspector } from "./agent-tree-inspector";
import { AgentTreeList, paneLabel } from "./agent-tree-list";
import { useRpc } from "./use-rpc";
import { MESSAGE_VERB, treeRows, type AgentPane } from "./views-logic";

type Orchestration = Record<string, any>;
type Tab = "flow" | "messages" | "policy";
const TABS: [Tab, string][] = [["flow", "Flow"], ["messages", "Messages"], ["policy", "Policy"]];

/** Selection, tab and filter survive leaving the view. */
const useTreeNav = create<{ selected: string | null; tab: Tab; query: string }>(() => ({ selected: null, tab: "flow", query: "" }));

function Messages({ messages, name }: { messages: AgentMessage[]; name: (id?: string | null) => string }) {
  if (!messages.length) return <div className="meta at-empty">No agent-to-agent activity yet. Agents use `dr run`, `dr wait`, `dr send`.</div>;
  return <>{messages.slice().reverse().map((m, i) => (
    <div className={`at-msg k-${m.kind}`} key={i}>
      <span className="meta mono">{hhmm(m.at)}</span>
      <span className="at-dot" />
      <div className="grow">
        <b>{name(m.source)}</b>{` ${MESSAGE_VERB[m.kind] || m.kind} `}<b>{name(m.target)}</b>
        {m.text ? <div className="mono meta" style={{ marginTop: 3, whiteSpace: "pre-wrap" }}>{m.text}</div> : null}
      </div>
    </div>
  ))}</>;
}

function PolicyPanel({ o }: { o: Orchestration }) {
  const items: [string, unknown][] = [
    ["Agents may answer prompts", o.agents_may_answer_permission_prompts ?? "ask-user"], ["Max agents", o.max_panes ?? "?"],
    ["Max depth", o.max_depth ?? "?"], ["Stop helpers with parent", !!o.kill_children_on_parent_exit],
  ];
  return (
    <div className="at-policy">
      {items.map(([k, v]) => <div key={k} className="at-tile"><span className="meta">{k}</span><span className="v">{String(v)}</span></div>)}
      <div className="meta" style={{ gridColumn: "1 / -1" }}>Edit these under [orchestration] in settings.toml.</div>
    </div>
  );
}

export default function TreeView() {
  const panes = useStore((s) => s.panes) as AgentPane[];
  const paneById = useStore((s) => s.paneById) as Map<string, AgentPane>;
  const o = (useStore((s) => s.raw.orchestration) || {}) as Orchestration;
  const { selected: picked, tab, query } = useTreeNav();
  const rows = useMemo(() => treeRows(panes), [panes]);
  const selected = picked && paneById.has(picked) ? picked
    : rows.find((r) => panes.some((p) => p.parent === r.pane.id))?.pane.id || rows[0]?.pane.id || null;
  const root = selected ? rootOf(selected, paneById) : null;
  const tree = useMemo(() => (root ? subtreeIds(root, panes) : []), [root, panes]);
  // One fetch for the whole tree; refetch when panes change (agent-to-agent activity shows up as state changes) or a
  // Claude Code sub-agent starts / stops (the "messages" tick).
  const tick = useMessagesTick((s) => s.n);
  const { data: fetched, error, stale } = useRpc<AgentMessage[]>("messages.list", root ? { pane: root } : {}, [root, panes, tick]);
  const data = stale ? null : fetched;  // never draw another tree's messages on this tree's lanes
  const messages = data || [];
  // Sub-agents get a lane right after their pane; lanesById resolves both real panes and sub-agents.
  const subs = useMemo(() => subAgentPanes(messages, paneById).filter((s) => tree.includes(s.parent || "")), [messages, paneById, tree]);
  const laneIds = useMemo(() => [YOU, ...withSubLanes(tree, subs)], [tree, subs]);
  const lanesById = useMemo(() => new Map([...paneById, ...subs.map((s) => [s.id, s] as const)]), [paneById, subs]);
  const focus = useMemo(() => {
    if (!selected || selected === root) return null;
    const ids = subtreeIds(selected, panes);
    return new Set([...ids, ...subs.filter((s) => ids.includes(s.parent || "")).map((s) => s.id)]);
  }, [selected, root, panes, subs]);
  const shown = focus ? messages.filter((m) => touches(m, focus)) : messages;
  const anyLive = tree.some((id) => ["working", "blocked"].includes(paneById.get(id)?.state || ""));

  useEffect(() => {
    setTopExtra("tree", { right: <span className="meta">
      {o.max_panes ? `${rows.length} of ${o.max_panes} agents · depth limit ${o.max_depth}` : `${rows.length} agents`}</span> });
  }, [rows.length, o.max_panes, o.max_depth]);
  useEffect(() => () => clearTopExtra("tree"), []);

  const send = () => {
    const text = window.prompt("Send to agent");
    if (!text || !selected) return;
    conn.rpc("pane.send", { pane: selected, text }).catch(errorToast);
  };
  const stop = () => { if (selected) conn.rpc("pane.close", { pane: selected, subtree: true }).catch(errorToast); };
  const name = (id?: string | null) => paneLabel(lanesById.get(id || "")) || id || "you";
  const pane = selected ? paneById.get(selected) : undefined;
  const rootPane = root ? paneById.get(root) : undefined;

  return (
    <div className="vsplit at">
      <AgentTreeList rows={rows} panes={panes} selected={selected} query={query}
        onQuery={(q) => useTreeNav.setState({ query: q })} onPick={(id) => useTreeNav.setState({ selected: id })} />
      <div className="at-main">
        {pane && rootPane ? (
          <AgentTreeInspector pane={pane} root={rootPane} paneById={paneById} onSend={send} onStop={stop}
            tree={tree.map((id) => paneById.get(id)).filter((p): p is AgentPane => !!p)} />
        ) : null}
        <div className="panel at-act">
          <div className="ph">
            <div className="at-tabs" role="group" aria-label="View">
              {TABS.map(([id, text]) => (
                <button key={id} className={"seg" + (tab === id ? " on" : "")} aria-pressed={tab === id}
                  onClick={() => useTreeNav.setState({ tab: id })}>{text}</button>
              ))}
            </div>
            <span className="grow" />
            {tab !== "policy" && pane && data ? <span className="at-live s-working">
              {anyLive ? <span className="at-dot live" /> : null}
              {`${anyLive ? "Live · " : ""}${shown.length} event${shown.length === 1 ? "" : "s"}`}</span> : null}
          </div>
          {tab === "policy" ? <PolicyPanel o={o} />
            : !selected ? <div className="meta at-empty">Start an agent to see activity.</div>
            : error ? <div className="errtext" style={{ padding: 14 }}>{error}</div>
            : !data ? <div className="meta at-empty">Loading…</div>
            : tab === "flow" ? <AgentFlowBoard messages={messages} laneIds={laneIds} paneById={lanesById} selected={selected} focus={focus} />
            : <div className="pb-body" style={{ padding: "4px 14px" }}>
                <Messages messages={shown} name={name} />
              </div>}
        </div>
      </div>
    </div>
  );
}
