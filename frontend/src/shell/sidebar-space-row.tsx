import { memo } from "react";
import { paneIndicator } from "./pane-indicator";
import type { Space } from "../core/protocol-types";
import { useStore } from "../core/store";
import { SpaceAvatar } from "../ui/atoms/space-avatar";
import { allActions } from "../actions/build-actions";
import { openContextMenu } from "../core/context-menu-store";
import { useRenaming } from "../core/inline-rename-store";
import { InlineNameInput } from "./inline-name-input";
import { spaceIndicatorKind } from "./shell-logic";

function close(e: { stopPropagation(): void }, id: string) { e.stopPropagation(); void allActions.closeSpace(id); }

/** One space row. Subscribes to its own indicator string, so unrelated pane updates do not touch it. */
export const SidebarSpaceRow = memo(function SidebarSpaceRow({ space, on }: { space: Space; on: boolean }) {
  const kind = useStore((s) => spaceIndicatorKind(s.panes, space.id));
  const key = `space:${space.id}`;
  const renaming = useRenaming((s) => s.key === key);
  return (
    <button data-key={key} className={"srow" + (on ? " on" : "")} title={space.cwd}
      onClick={() => allActions.selectSpace(space.id)}
      onDoubleClick={() => void allActions.renameSpace(space.id)}
      onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}
      onAuxClick={(e) => { if (e.button === 1) void allActions.closeSpace(space.id); }}
      onKeyDown={(e) => {
        if (e.key === "F2") { e.preventDefault(); void allActions.renameSpace(space.id); }
        else if (e.key === "Delete") { e.preventDefault(); void allActions.closeSpace(space.id); }
      }}
      onContextMenu={(e) => openContextMenu(e, [
        { label: "Rename space…", hint: "F2", run: () => void allActions.renameSpace(space.id) },
        { label: "New terminal here", run: () => { allActions.selectSpace(space.id); allActions.newAgent(); } },
        { label: "Close space", hint: "Del", danger: true, run: () => void allActions.closeSpace(space.id) },
      ])}>
      <SpaceAvatar space={space} />
      {renaming ? <InlineNameInput value={space.name ?? ""} onCommit={(n) => allActions.setSpaceName(space.id, n)} />
        : <span className="trunc">{space.name}</span>}
      <span className="git">{space.branch || ""}{space.dirty ? <span className="gb-dirty" title={`${space.dirty} uncommitted`}>●</span> : null}</span>
      {paneIndicator(kind)}
      {/* A span, not a button: buttons cannot nest inside the row button. */}
      <span className="sclose" role="button" tabIndex={0} title="Close space" aria-label={`Close ${space.name}`}
        onClick={(e) => close(e, space.id)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); close(e, space.id); } }}>×</span>
    </button>
  );
});
