import { memo } from "react";
import type { Pane } from "../core/protocol-types";
import { ago } from "../core/format";
import { allActions } from "../actions/build-actions";
import { openContextMenu } from "../core/context-menu-store";
import { useRenaming } from "../core/inline-rename-store";
import { InlineNameInput } from "./inline-name-input";
import { KindIcon } from "../ui/atoms/kind-icon";
import { StateMark } from "../ui/atoms/state-mark";

const rename = (id: string) => void allActions.rename({ paneId: id });
const close = (id: string) => void allActions.closePane({ paneId: id });

/** Hover buttons are spans, not buttons: a button cannot nest inside the row button. Mouse, Enter and Space all work. */
function RowTool({ label, onRun, children }: { label: string; onRun: () => void; children: string }) {
  return (
    <span className="sclose" role="button" tabIndex={0} title={label} aria-label={label}
      onClick={(e) => { e.stopPropagation(); onRun(); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onRun(); } }}>{children}</span>
  );
}

/** One agent row; re-renders only when its pane object or focus flag changes.
 *  Click focus · double-click or F2 rename · Delete, middle-click or × close · right-click menu. */
export const SidebarAgentRow = memo(function SidebarAgentRow({ pane, on }: { pane: Pane; on: boolean }) {
  const key = `pane:${pane.id}`;
  const renaming = useRenaming((s) => s.key === key);
  return (
    <button data-key={key} className={`srow ${pane.state}` + (on ? " on" : "")} title={`${pane.command}\n${pane.cwd}`}
      onClick={() => allActions.focusPane(pane.id)}
      onDoubleClick={() => rename(pane.id)}
      onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }} // no browser autoscroll on middle click
      onAuxClick={(e) => { if (e.button === 1) close(pane.id); }}
      onKeyDown={(e) => {
        if (e.key === "F2") { e.preventDefault(); rename(pane.id); }
        else if (e.key === "Delete") { e.preventDefault(); close(pane.id); }
      }}
      onContextMenu={(e) => openContextMenu(e, [
        { label: "Rename…", hint: "F2", run: () => rename(pane.id) },
        { label: "Restart and resume", run: () => allActions.restart({ paneId: pane.id }) },
        { label: "Zoom", run: () => allActions.zoom({ paneId: pane.id }) },
        { label: "Close agent", hint: "Del", danger: true, run: () => close(pane.id) },
      ])}>
      <KindIcon kind={pane.kind} />
      {renaming ? <InlineNameInput value={pane.name ?? ""} onCommit={(n) => allActions.setPaneName(pane.id, n)} />
        : <span className="nm grow trunc">{pane.name}{pane.summary ? <span className="sum"> · {pane.summary}</span> : null}</span>}
      {pane.unread ? <span className="dot unread" title="unread" /> : null}
      <span className="t">{ago((pane.since || pane.created_at) as number)}</span>
      <StateMark pane={pane} />
      <RowTool label={`Rename ${pane.name}`} onRun={() => rename(pane.id)}>✎</RowTool>
      <RowTool label={`Close ${pane.name}`} onRun={() => close(pane.id)}>×</RowTool>
    </button>
  );
});
