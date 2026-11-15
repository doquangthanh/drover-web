// Agent tree: who started whom, plus the messages they exchanged (dr run / wait / send / read).
import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { allActions } from "../actions/build-actions";
import { conn } from "../core/connection";
import { ago } from "../core/format";
import { useStore } from "../core/store";
import { errorToast } from "../core/toast-store";
import { clearTopExtra, setTopExtra } from "../shell/top-extra-store";
import { KindIcon } from "../ui/atoms/kind-icon";
import { StateMark } from "../ui/atoms/state-mark";
import { useRpc } from "./use-rpc";
import { MESSAGE_VERB, treeRows, type AgentPane } from "./views-logic";

type Orchestration = Record<string, any>;
interface AgentMessage { at: number; source?: string; target?: string; kind: string; text?: string }

/** Selection + tab survive leaving the view, like the old module state. */
const useTreeNav = create<{ selected: string | null; tab: "messages" | "policy" }>(() => ({ selected: null, tab: "messages" }));

function Messages({ selected }: { selected: string }) {
  const paneById = useStore((s) => s.paneById);
  const panes = useStore((s) => s.panes);
  // Refetch when panes change: agent-to-agent activity shows up as state changes.
  const { data, error } = useRpc<AgentMessage[]>("messages.list", { pane: selected }, [selected, panes]);
  const name = (id?: string) => paneById.get(id || "")?.name || id || "you";
  if (error) return <div className="errtext">{error}</div>;
  if (!data) return <div className="meta">Loading…</div>;
  if (!data.length) return <div className="meta">No agent-to-agent activity yet. Agents use `dr run`, `dr wait`, `dr send`.</div>;
  return <>{data.slice().reverse().map((m, i) => (
    <div className="msg" key={i}>
      <span className="meta mono">{new Date(m.at * 1000).toLocaleTimeString().slice(0, 5)}</span>
      <div>
        <b>{name(m.source)}</b>{` ${MESSAGE_VERB[m.kind] || m.kind} `}<b>{name(m.target)}</b>
        {m.text ? <div className="mono meta" style={{ marginTop: 3, whiteSpace: "pre-wrap" }}>{m.text}</div> : null}
      </div>
    </div>
  ))}</>;
}

function PolicyPanel({ o }: { o: Orchestration }) {
  return <>
    <div className="kv" style={{ padding: "10px 0" }}>
      <span>Agents may answer prompts</span><span className="mono">{String(o.agents_may_answer_permission_prompts ?? "ask-user")}</span>
      <span>Max agents</span><span className="mono">{String(o.max_panes ?? "?")}</span>
      <span>Max depth</span><span className="mono">{String(o.max_depth ?? "?")}</span>
      <span>Stop helpers with parent</span><span className="mono">{String(!!o.kill_children_on_parent_exit)}</span>
    </div>
    <div className="meta">Edit these under [orchestration] in settings.toml.</div>
  </>;
}

export default function TreeView() {
  const panes = useStore((s) => s.panes) as AgentPane[];
  const paneById = useStore((s) => s.paneById);
  const o = (useStore((s) => s.raw.orchestration) || {}) as Orchestration;
  const { selected: picked, tab } = useTreeNav();
  const rows = useMemo(() => treeRows(panes), [panes]);
  const selected = picked && paneById.has(picked) ? picked
    : rows.find((r) => panes.some((p) => p.parent === r.pane.id))?.pane.id || rows[0]?.pane.id || null;
  const roots = rows.filter((r) => r.prefix.length === 2).length;

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
  const seg = (id: "messages" | "policy", text: string) => (
    <button className={"seg" + (tab === id ? " on" : "")} onClick={() => useTreeNav.setState({ tab: id })}>{text}</button>
  );

  return (
    <div className="vsplit">
      <div className="panel tpanel" style={{ width: 420, flex: "none" }}>
        <div className="pb-body" style={{ padding: 10 }}>
          <div className="node"><span className="you">you</span><span className="meta">{`started ${roots} agent${roots === 1 ? "" : "s"}`}</span></div>
          {rows.map(({ pane, prefix }) => (
            <button key={pane.id} className={"node" + (pane.id === selected ? " on" : "")} onClick={() => useTreeNav.setState({ selected: pane.id })}>
              <span className="tree">{prefix}</span><KindIcon kind={pane.kind} /><span className="grow trunc">{pane.name}</span>
              <span className="meta">{pane.state === "idle" && pane.parent ? "waits" : pane.machine && pane.machine !== "local" ? pane.machine : ago(pane.created_at || 0)}</span>
              <StateMark pane={pane} />
            </button>
          ))}
          {rows.length ? null : <div className="meta">No agents.</div>}
        </div>
        {selected ? (
          <div className="row tbtn">
            <button className="btn" onClick={() => allActions.focusPane(selected)}>Open</button>
            <button className="btn" onClick={send}>Send…</button>
            <button className="btn danger" onClick={() => conn.rpc("pane.close", { pane: selected, subtree: true }).catch(errorToast)}>Stop subtree</button>
          </div>
        ) : null}
      </div>
      <div className="panel grow">
        <div className="ph s38" style={{ gap: 4 }}>
          {seg("messages", "Messages")}{seg("policy", "Policy")}<span className="grow" />
          <span className="meta">{selected ? `${paneById.get(selected)?.name} and its helpers` : ""}</span>
        </div>
        <div className="pb-body" style={{ padding: "4px 14px" }}>
          {tab === "policy" ? <PolicyPanel o={o} />
            : selected ? <Messages selected={selected} /> : <div className="meta">Start an agent to see activity.</div>}
        </div>
      </div>
    </div>
  );
}
