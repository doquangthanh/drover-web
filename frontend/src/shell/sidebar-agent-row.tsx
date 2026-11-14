import { memo } from "react";
import type { Pane } from "../core/protocol-types";
import { ago } from "../core/format";
import { allActions } from "../actions/build-actions";
import { KindIcon } from "../ui/atoms/kind-icon";
import { StateMark } from "../ui/atoms/state-mark";

/** One agent row; re-renders only when its pane object or focus flag changes. */
export const SidebarAgentRow = memo(function SidebarAgentRow({ pane, on }: { pane: Pane; on: boolean }) {
  return (
    <button className={`srow ${pane.state}` + (on ? " on" : "")} title={`${pane.command}\n${pane.cwd}`}
      onClick={() => allActions.focusPane(pane.id)}>
      <KindIcon kind={pane.kind} />
      <span className="nm grow trunc">{pane.name}</span>
      {pane.unread ? <span className="dot unread" title="unread" /> : null}
      <span className="t">{ago((pane.since || pane.created_at) as number)}</span>
      <StateMark pane={pane} />
    </button>
  );
});
