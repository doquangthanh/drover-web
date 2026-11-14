// Worktrees of the repo (one row each) plus actions for the selected one. Used by the desktop left panel and the phone picker.
import type { CSSProperties } from "react";
import { hooks } from "../actions/feature-hooks";
import { useStore } from "../core/store";
import type { Pane } from "../core/protocol-types";
import { KindIcon } from "../ui/atoms/kind-icon";
import { StateMark } from "../ui/atoms/state-mark";
import { patchChangesUi } from "./changes-store";
import type { Worktree } from "./use-changes-data";
import type { WorktreeActions } from "./use-worktree-actions";

const norm = (p: string) => p.replace(/\\/g, "/");

interface Props {
  trees: Worktree[]; mainTree: Worktree | undefined; current: Worktree | undefined; path: string; confirm: boolean;
  machine: string | null; actions: WorktreeActions;
}

function Row({ t, agent, on }: { t: Worktree; agent: Pane | undefined; on: boolean }) {
  const count = t.changes ? <span style={{ color: "var(--yellow)" }}>{`${t.changes} files`}</span> : "clean";
  const style: CSSProperties | undefined = t.missing ? { opacity: 0.5 } : undefined;
  return (
    <button className={"wt" + (on ? " on" : "")} disabled={t.missing} style={style}
      onClick={() => patchChangesUi({ path: t.path, file: null, stage: "list", confirm: false })}>
      <span className="top">
        {agent ? <KindIcon kind={agent.kind} /> : null}
        <span className={"grow trunc" + (agent ? "" : " mono")}>{agent ? agent.name : t.branch || "(detached)"}</span>
        {agent ? <StateMark pane={agent} /> : <span className="meta">{t.missing ? "folder deleted" : count}</span>}
      </span>
      <span className="meta trunc">
        {agent ? <><span className="mono" style={{ color: on ? "var(--accent)" : "" }}>{t.branch}</span>{" · "}{count}</> : <span className="mono">{t.path}</span>}
      </span>
    </button>
  );
}

export function WorktreeList({ trees, mainTree, current, path, confirm, machine, actions }: Props) {
  const panes = useStore((s) => s.panes);
  const agentIn = (p: string) => panes.find((x) => x.cwd && norm(x.cwd).startsWith(norm(p)));
  const missing = trees.filter((t) => t.missing).length;
  const isOther = !!current && current !== mainTree;
  return (
    <div className="wtlist">
      {trees.map((t, i) => <Row key={t.path} t={t} agent={i ? agentIn(t.path) : undefined} on={t.path === path} />)}
      {missing ? (
        <div style={{ padding: "4px 10px" }}>
          <button className="btn" title="git worktree prune: forget worktrees whose folder is gone" onClick={() => actions.prune(missing)}>{`Clean up ${missing} deleted`}</button>
        </div>
      ) : null}
      {isOther ? (
        <div className="row" style={{ padding: "6px 10px", flexWrap: "wrap" }}>
          <button className="btn" onClick={() => hooks.openNewAgent({ cwd: current.path, machine })}>Agent here</button>
          <button className="btn danger" onClick={() => patchChangesUi({ confirm: true })}>Remove</button>
        </div>
      ) : null}
      <span className="grow" />
      {confirm && isOther ? (
        <div className="warnbox" style={{ margin: 6 }}>
          <b>{`Remove “${agentIn(current.path)?.name || current.branch}”? `}</b>
          {current.changes ? `It has ${current.changes} uncommitted files, so herd won't delete it unless you force it.` : `${current.path} will be deleted.`}
          <div className="row" style={{ marginTop: 8 }}>
            <button className={"btn" + (current.changes ? " danger" : "")} onClick={() => actions.removeCurrent(!!current.changes)}>{current.changes ? "Remove anyway" : "Remove"}</button>
            <button className="btn" onClick={() => patchChangesUi({ confirm: false })}>Cancel</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
