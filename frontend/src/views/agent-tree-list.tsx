// Agent tree, left panel: "you" at the top, then who started whom with connector lines, a name filter and state counts.
import { ago } from "../core/format";
import { Icon } from "../ui/atoms/icon";
import { KindIcon } from "../ui/atoms/kind-icon";
import { StateMark } from "../ui/atoms/state-mark";
import { stateCounts } from "./agent-flow-logic";
import { filterTreeRows, type AgentPane, type TreeRow } from "./views-logic";

const COUNTED = ["working", "blocked", "done", "idle"] as const;

export const paneLabel = (p?: AgentPane) => p?.name || p?.title || p?.id || "";

function meta(p: AgentPane): string {
  if (p.state === "idle" && p.parent) return "waits";
  if (p.machine && p.machine !== "local") return p.machine;
  return ago(p.created_at || 0);
}

function Row({ row, on, onPick }: { row: TreeRow; on: boolean; onPick: () => void }) {
  const p = row.pane;
  const sub = p.title && p.title !== p.name ? p.title : p.command || "";
  return (
    <button className={"at-row" + (on ? " on" : "")} aria-current={on || undefined} onClick={onPick}>
      {row.guides.map((g, i) => <span key={i} className={"at-g" + (g ? " on" : "")} aria-hidden="true" />)}
      <span className={"at-elbow" + (row.last ? " last" : "")} aria-hidden="true" />
      <span className="at-row-body">
        <span className="at-av"><KindIcon kind={p.kind} /><span className={`badge s-${p.state}`} /></span>
        <span className="at-text">
          <span className={"name trunc" + (p.parent ? "" : " root")}>{paneLabel(p)}</span>
          {sub ? <span className="sub trunc mono">{sub}</span> : null}
        </span>
        <span className="at-end"><StateMark pane={p} /><span className="meta">{meta(p)}</span></span>
      </span>
    </button>
  );
}

export function AgentTreeList({ rows, panes, selected, query, onQuery, onPick }: {
  rows: TreeRow[]; panes: AgentPane[]; selected: string | null; query: string;
  onQuery: (q: string) => void; onPick: (id: string) => void;
}) {
  const counts = stateCounts(panes);
  const shown = filterTreeRows(rows, query);
  const roots = rows.filter((r) => r.guides.length === 0).length;
  return (
    <div className="panel at-tree">
      <div className="at-head">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="at-cap">AGENTS · {panes.length}</span>
          <span className="at-counts">
            {COUNTED.map((s) => <span key={s} className={`s-${s}`} title={s}><span className="at-dot" />{counts[s]}</span>)}
          </span>
        </div>
        <label className="at-filter">
          <Icon name="search" />
          <input type="search" placeholder="Filter agents" aria-label="Filter agents" value={query}
            onChange={(e) => onQuery(e.target.value)} />
        </label>
      </div>
      <div className="pb-body">
        <div className="at-you">
          <span className="av">you</span>
          <span className="at-text"><span className="name root">You</span>
            <span className="sub">{`started ${roots} agent${roots === 1 ? "" : "s"}`}</span></span>
        </div>
        {shown.map((row) => (
          <Row key={row.pane.id} row={row} on={row.pane.id === selected} onPick={() => onPick(row.pane.id)} />
        ))}
        {!rows.length ? <div className="meta at-empty">No agents.</div>
          : !shown.length ? <div className="meta at-empty">No agent matches “{query}”.</div> : null}
      </div>
    </div>
  );
}
