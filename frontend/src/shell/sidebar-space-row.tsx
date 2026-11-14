import { memo } from "react";
import { paneIndicator } from "./pane-indicator";
import type { Space } from "../core/protocol-types";
import { useStore } from "../core/store";
import { SpaceAvatar } from "../ui/atoms/space-avatar";
import { allActions } from "../actions/build-actions";
import { spaceIndicatorKind } from "./shell-logic";

function close(e: { stopPropagation(): void }, id: string) { e.stopPropagation(); void allActions.closeSpace(id); }

/** One space row. Subscribes to its own indicator string, so unrelated pane updates do not touch it. */
export const SidebarSpaceRow = memo(function SidebarSpaceRow({ space, on }: { space: Space; on: boolean }) {
  const kind = useStore((s) => spaceIndicatorKind(s.panes, space.id));
  return (
    <button className={"srow" + (on ? " on" : "")} title={space.cwd}
      onClick={() => allActions.selectSpace(space.id)}
      onContextMenu={(e) => { e.preventDefault(); void allActions.closeSpace(space.id); }}>
      <SpaceAvatar space={space} />
      <span className="trunc">{space.name}</span>
      <span className="git">{space.branch || ""}{space.dirty ? <span className="gb-dirty" title={`${space.dirty} uncommitted`}>●</span> : null}</span>
      {paneIndicator(kind)}
      {/* A span, not a button: buttons cannot nest inside the row button. */}
      <span className="sclose" role="button" tabIndex={0} title="Close space" aria-label={`Close ${space.name}`}
        onClick={(e) => close(e, space.id)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); close(e, space.id); } }}>×</span>
    </button>
  );
});
