import { memo } from "react";
import { paneIndicator } from "./pane-indicator";
import type { Space } from "../core/protocol-types";
import { useStore } from "../core/store";
import { machineAlias } from "../core/store-derive";
import { SpaceAvatar } from "../ui/atoms/space-avatar";
import { Icon } from "../ui/atoms/icon";
import { allActions } from "../actions/build-actions";
import { openContextMenu } from "../core/context-menu-store";
import { useRenaming } from "../core/inline-rename-store";
import { InlineNameInput } from "./inline-name-input";
import { machineDot, spaceIndicatorKind } from "./shell-logic";

function close(e: { stopPropagation(): void }, id: string) { e.stopPropagation(); void allActions.closeSpace(id); }

/** Remote workspaces carry their machine as a chip, with the link state as a dot. */
function MachineChip({ alias }: { alias: string }) {
  const status = useStore((s) => s.raw.machines?.find((m) => m.alias === alias)?.status || "");
  return <span className="mchip" title={`${alias} · ${status || "unknown"}`}><span className={`dot ${machineDot(status)}`} />{alias}</span>;
}

/** One workspace row, the head of its group in the sidebar tree. The chevron (or ←/→) collapses the agents under it.
 *  Subscribes to its own indicator string, so unrelated pane updates do not touch it. */
export const SidebarSpaceRow = memo(function SidebarSpaceRow({ space, on, collapsed, empty, onToggle }: {
  space: Space; on: boolean; collapsed: boolean; empty: boolean; onToggle: () => void;
}) {
  const kind = useStore((s) => spaceIndicatorKind(s.panes, space.id));
  const key = `space:${space.id}`;
  const renaming = useRenaming((s) => s.key === key);
  const alias = machineAlias(space);
  const toggle = (e: { stopPropagation(): void }) => { e.stopPropagation(); onToggle(); };
  return (
    <button data-key={key} className={"srow wsrow" + (on ? " on" : "")} title={space.cwd} aria-expanded={!collapsed}
      onClick={() => allActions.selectSpace(space.id)}
      onDoubleClick={() => void allActions.renameSpace(space.id)}
      onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}
      onAuxClick={(e) => { if (e.button === 1) void allActions.closeSpace(space.id); }}
      onKeyDown={(e) => {
        if (e.key === "F2") { e.preventDefault(); void allActions.renameSpace(space.id); }
        else if (e.key === "Delete") { e.preventDefault(); void allActions.closeSpace(space.id); }
        else if (!empty && ((e.key === "ArrowLeft" && !collapsed) || (e.key === "ArrowRight" && collapsed))) { e.preventDefault(); onToggle(); }
      }}
      onContextMenu={(e) => openContextMenu(e, [
        { label: "Rename workspace…", hint: "F2", run: () => void allActions.renameSpace(space.id) },
        { label: "New agent here", run: () => { allActions.selectSpace(space.id); allActions.newAgent(); } },
        ...(empty ? [] : [{ label: collapsed ? "Expand" : "Collapse", hint: collapsed ? "→" : "←", run: onToggle }]),
        { label: "Close workspace", hint: "Del", danger: true, run: () => void allActions.closeSpace(space.id) },
      ])}>
      {/* A span, not a button: buttons cannot nest inside the row button. */}
      {empty ? <span className="wschev" aria-hidden="true" />
        : <span className={"wschev" + (collapsed ? "" : " open")} role="button" tabIndex={-1} aria-label={collapsed ? "Expand" : "Collapse"}
          onClick={toggle} onDoubleClick={(e) => e.stopPropagation()}><Icon name="chevron" /></span>}
      <SpaceAvatar space={space} />
      {renaming ? <InlineNameInput value={space.name ?? ""} onCommit={(n) => allActions.setSpaceName(space.id, n)} />
        : <span className="trunc">{space.name}</span>}
      {alias ? <MachineChip alias={alias} />
        : <span className="git">{space.branch || ""}{space.dirty ? <span className="gb-dirty" title={`${space.dirty} uncommitted`}>●</span> : null}</span>}
      {paneIndicator(kind)}
      <span className="sclose" role="button" tabIndex={0} title="Close workspace" aria-label={`Close ${space.name}`}
        onClick={(e) => close(e, space.id)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); close(e, space.id); } }}>×</span>
    </button>
  );
});
