// Inbox: every agent sorted by who needs you; quick answers without opening the pane.
// Subscribes to narrow store slices (panes, machines, policy prompts, focused pane), never to the whole state.
import { Fragment, useEffect, useMemo } from "react";
import { create } from "zustand";
import { allActions } from "../actions/build-actions";
import { conn } from "../core/connection";
import { useStore } from "../core/store";
import { errorToast } from "../core/toast-store";
import { clearTopExtra, setTopExtra } from "../shell/top-extra-store";
import { InboxCard } from "./inbox-card";
import { InboxSidePanel } from "./inbox-side-panel";
import { INBOX_GROUPS, inMachine, matchesFilter, type AgentPane, type InboxFilter, type PolicyPending } from "./views-logic";

/** Kept across view switches, like the old module-level variables. */
const useInboxFilter = create<{ filter: InboxFilter; machine: string }>(() => ({ filter: "all", machine: "" }));
const EMPTY: PolicyPending[] = [];

function markAllRead() {
  const unread = useStore.getState().panes.filter((p) => p.unread);
  Promise.all(unread.map((p) => conn.rpc("pane.focus", { pane: p.id }))).catch(() => {});
}

function PolicyCard({ p }: { p: PolicyPending }) {
  const target = useStore((s) => s.paneById.get(p.target));
  const source = useStore((s) => s.paneById.get(p.source));
  const machine = String(p.id).includes(":") ? String(p.id).split(":")[0] : null;
  const decide = (allow: boolean) =>
    conn.rpc("policy.decide", machine ? { id: p.id, allow, machine } : { id: p.id, allow }).catch(errorToast);
  return (
    <div className="warnbox">
      <b>{`${source?.name || p.source} tried to answer “${p.text}” for ${target?.name || p.target}. `}</b>
      Your policy says agents can't approve permission prompts, so it's waiting for you.
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn pri" onClick={() => decide(true)}>Allow once</button>
        <button className="btn" onClick={() => decide(false)}>Deny</button>
        <button className="btn" onClick={() => allActions.focusPane(p.target)}>Open</button>
      </div>
    </div>
  );
}

function Segs({ scoped, filter }: { scoped: AgentPane[]; filter: InboxFilter }) {
  const n = (f: (p: AgentPane) => boolean) => scoped.filter(f).length;
  const items: [InboxFilter, string][] = [
    ["all", `All ${scoped.length}`], ["blocked", `Needs you ${n((p) => p.state === "blocked")}`],
    ["done", `Done ${n((p) => p.state === "done")}`], ["unread", `Unread ${n((p) => !!p.unread)}`],
  ];
  return <>{items.map(([key, text]) => (
    <button key={key} className={"seg" + (filter === key ? " on" : "")} onClick={() => useInboxFilter.setState({ filter: key })}>{text}</button>
  ))}</>;
}

export default function InboxView() {
  const { filter, machine } = useInboxFilter();
  const panes = useStore((s) => s.panes) as AgentPane[];
  const machines = useStore((s) => s.raw.machines);
  const policy = (useStore((s) => s.raw.policy_pending) || EMPTY) as PolicyPending[];
  const focused = useStore((s) => s.ui.focusedPane);
  const spaces = useStore((s) => s.spaceById);

  const scoped = useMemo(() => panes.filter((p) => inMachine(p, machine)), [panes, machine]);
  const shown = useMemo(() => scoped.filter((p) => matchesFilter(p, filter)), [scoped, filter]);
  const helperCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of panes) if (p.parent) m.set(p.parent, (m.get(p.parent) || 0) + 1);
    return m;
  }, [panes]);

  useEffect(() => {
    setTopExtra("inbox", {
      meta: <div className="seg-b"><Segs scoped={scoped} filter={filter} /></div>,
      right: <>
        <select className="seg" aria-label="Machine" value={machine} onChange={(e) => useInboxFilter.setState({ machine: e.target.value })}>
          <option value="">All machines</option><option value="local">This computer</option>
          {(machines || []).map((m) => <option key={m.alias} value={m.alias}>{m.alias}</option>)}
        </select>
        <button className="seg" onClick={markAllRead}>Mark all read</button>
      </>,
    });
  }, [scoped, filter, machine, machines]);
  useEffect(() => () => clearTopExtra("inbox"), []);

  return (
    <div className="inbox-wrap">
      <div className="view inbox">
        <div className="row mobile-only">
          <Segs scoped={scoped} filter={filter} /><span className="grow" /><button className="seg" onClick={markAllRead}>Mark all read</button>
        </div>
        {policy.map((p) => <PolicyCard key={p.id} p={p} />)}
        {INBOX_GROUPS.map(([text, states]) => {
          const items = shown.filter((p) => states.includes(p.state));
          if (!items.length) return null;
          return (
            <Fragment key={text}>
              <div className="sechead">{text}</div>
              <div className="stack">
                {items.map((p) => (
                  <InboxCard key={p.id} pane={p} spaceName={spaces.get(p.space_id || "")?.name || ""}
                    helpers={helperCount.get(p.id) || 0} focused={focused === p.id} />
                ))}
              </div>
            </Fragment>
          );
        })}
        {!panes.length ? <div className="meta">No agents yet.</div> : null}
      </div>
      <InboxSidePanel />
    </div>
  );
}
