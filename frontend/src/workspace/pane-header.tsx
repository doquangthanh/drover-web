import { memo, type MouseEvent } from "react";
import { allActions } from "../actions/build-actions";
import { shortPath } from "../core/format";
import { useStore } from "../core/store";
import { BranchChip } from "../ui/atoms/branch-chip";
import { Icon } from "../ui/atoms/icon";
import { KindIcon } from "../ui/atoms/kind-icon";
import { StateMark } from "../ui/atoms/state-mark";

const stop = (fn: () => void) => (e: MouseEvent) => { e.stopPropagation(); fn(); };

export const PaneHeader = memo(function PaneHeader({ paneId }: { paneId: string }) {
  const pane = useStore((s) => s.paneById.get(paneId));
  const zoomed = useStore((s) => !!(pane && s.tabById.get(pane.tab_id || "")?.zoomed));
  const space = useStore((s) => (pane ? s.spaceById.get(pane.space_id || "") : undefined));
  if (!pane) return null;
  const where = shortPath(pane.cwd) + (pane.machine && pane.machine !== "local" ? ` · ${pane.machine}` : "") + (zoomed ? ` · pane ${pane.id}` : "");
  return (
    <div className="phead" onDoubleClick={(e) => { if (!(e.target as Element).closest("button")) allActions.zoom({ paneId }); }}
      onAuxClick={(e) => { if (e.button === 1) allActions.closePane({ paneId }); }}>
      <KindIcon kind={pane.kind} />
      <span className="pn">{pane.name}</span>
      <span className="cwd trunc" title={pane.cwd}>{where}</span>
      <span className="mobile-only"><BranchChip space={space} /></span>
      <StateMark pane={pane} />
      <button className="ibtn" title="Split right" aria-label="Split right" onClick={stop(() => allActions.splitRight({ paneId }))}><Icon name="split" /></button>
      <button className="ibtn" title="Zoom" aria-label="Zoom pane" onClick={stop(() => allActions.zoom({ paneId }))}><Icon name="zoom" /></button>
      <button className="ibtn" title="Close" aria-label="Close pane" onClick={stop(() => allActions.closePane({ paneId }))}><Icon name="close" /></button>
    </div>
  );
});
