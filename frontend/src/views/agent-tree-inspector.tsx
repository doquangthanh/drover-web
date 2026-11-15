// Agent tree, selected agent: who it is, what it does, the state of its whole tree and who is waiting for an answer.
import { allActions } from "../actions/build-actions";
import { ago } from "../core/format";
import { KindIcon } from "../ui/atoms/kind-icon";
import { stateCounts } from "./agent-flow-logic";
import { paneLabel } from "./agent-tree-list";
import type { AgentPane } from "./views-logic";

const STATE_LABEL: Record<string, string> = {
  working: "Working", blocked: "Needs you", done: "Done", idle: "Idle", exited: "Exited",
};
const SEG_ORDER = ["done", "working", "blocked", "idle", "exited"] as const;

export function stateLabel(p: AgentPane): string {
  return p.state === "exited" && p.exit_code ? `exit ${p.exit_code}` : STATE_LABEL[p.state] || p.state;
}

const live = (p: AgentPane) => p.state === "working" || p.state === "blocked";

export function AgentTreeInspector({ pane, root, tree, paneById, onSend, onStop }: {
  pane: AgentPane; root: AgentPane; tree: AgentPane[]; paneById: Map<string, AgentPane>;
  onSend: () => void; onStop: () => void;
}) {
  const helpers = tree.filter((p) => p.id !== root.id);
  const counts = stateCounts(tree);
  const helperCounts = stateCounts(helpers);
  const parent = pane.parent ? paneById.get(pane.parent) : undefined;
  const asks = tree.filter((p) => p.state === "blocked");
  const tiles: [string, string, string | number][] = [
    ["Helpers", "s-idle", helpers.length], ["Working", "s-working", counts.working],
    ["Needs you", "s-blocked", counts.blocked], ["Done", "s-done", counts.done],
    ["Running for", "s-idle", ago(root.created_at || 0)],
  ];
  return (
    <div className="panel at-insp">
      <div className="at-insp-top">
        <KindIcon kind={pane.kind} />
        <div className="at-insp-info">
          <div className="row" style={{ flexWrap: "wrap", gap: 10 }}>
            <h2 className="trunc">{paneLabel(pane)}</h2>
            <span className={`at-state s-${pane.state}`}><span className={"at-dot" + (live(pane) ? " live" : "")} />{stateLabel(pane)}</span>
          </div>
          {pane.title && pane.title !== pane.name ? <span className="at-insp-sub">{pane.title}</span> : null}
          <span className="at-facts">
            <span>CLI <b className="mono">{pane.kind || "?"}</b></span>
            <span>on <b>{pane.machine && pane.machine !== "local" ? pane.machine : "This computer"}</b></span>
            <span>started by <b>{parent ? paneLabel(parent) : "you"}</b></span>
            <span>running <b>{ago(pane.created_at || 0)}</b></span>
          </span>
        </div>
        <div className="at-actions">
          <button className="btn lg pri" onClick={() => allActions.focusPane(pane.id, true)}>Open</button>
          <button className="btn lg" onClick={onSend}>Send…</button>
          <button className="btn lg danger" onClick={onStop}>Stop subtree</button>
        </div>
      </div>

      <div className="at-tiles">
        {tiles.map(([label, cls, value]) => (
          <div key={label} className={`at-tile ${cls}`}>
            <span className="at-cap"><span className="at-dot" />{label.toUpperCase()}</span>
            <span className="v">{value}</span>
          </div>
        ))}
      </div>
      {helpers.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="at-segs" aria-hidden="true">
            {SEG_ORDER.filter((s) => helperCounts[s]).map((s) => <span key={s} className={`s-${s}`} style={{ flex: helperCounts[s] }} />)}
          </div>
          <span className="meta">{`${helperCounts.done} of ${helpers.length} helpers finished under ${paneLabel(root)}`}</span>
        </div>
      ) : null}

      {asks.map((p) => (
        <div key={p.id} className="at-ask s-blocked">
          <span className="at-dot live" />
          <span className="msg"><b>{paneLabel(p)}</b> needs an answer{p.title && p.title !== p.name ? <span className="mono"> · {p.title}</span> : null}</span>
          <button className="btn sm pri" onClick={() => allActions.focusPane(p.id, true)}>Answer</button>
        </div>
      ))}
    </div>
  );
}
