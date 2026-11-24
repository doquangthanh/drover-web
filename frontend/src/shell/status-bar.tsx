// #statusbar: connection, counts, branch chip, focused pane path, Ctrl+K chord indicator.
import { allActions } from "../actions/build-actions";
import { shortPath } from "../core/format";
import type { Machine } from "../core/protocol-types";
import { useStore } from "../core/store";
import { BranchChip } from "../ui/atoms/branch-chip";
import { HostPortal } from "./host-portal";
import { viewHints } from "./shell-logic";

const NO_MACHINES: Machine[] = [];

export function StatusBar() {
  const connected = useStore((s) => s.connected);
  const machines = useStore((s) => s.raw.machines) || NO_MACHINES;
  const spaceCount = useStore((s) => s.spaces.length);
  const paneCount = useStore((s) => s.panes.length);
  const blocked = useStore((s) => s.counts.blocked);
  const pane = useStore((s) => (s.ui.focusedPane ? s.paneById.get(s.ui.focusedPane) : undefined));
  const space = useStore((s) => s.spaceById.get(pane?.space_id || s.ui.spaceId || ""));
  const prefix = useStore((s) => s.ui.prefix);
  const view = useStore((s) => s.ui.view);
  const up = 1 + machines.filter((m) => m.status === "connected").length;
  return (
    <HostPortal id="statusbar">
      <span className="row" style={{ gap: 6 }}>
        <span className={`dot ${connected ? "ok" : "bad"}`} />
        {connected ? "drover-server up" : "reconnecting…"}
      </span>
      <span>{`${machines.length ? `${up} of ${1 + machines.length} machines` : "This computer"} · ${spaceCount} spaces · ${paneCount} agents`}</span>
      {blocked ? <span className="blocked">{`${blocked} need you`}</span> : null}
      <BranchChip space={space} onClick={() => allActions.show("changes")} />
      {pane ? <span className="trunc">{shortPath(pane.cwd)}</span> : null}
      <span className="grow" />
      {prefix ? <span className="prefix-on">(Ctrl+K) was pressed. Waiting for second key of chord…</span>
        : <>
          {viewHints(view).map(([key, what]) => <span key={key}><span className="k">{key}</span> {what}</span>)}
          <span><span className="k">?</span> <span className="k">Ctrl+K</span> <span className="k">Ctrl+S</span> shortcuts</span>
        </>}
    </HostPortal>
  );
}
