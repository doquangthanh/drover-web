// One pane: header, optional find bar, the terminal host, phone key strip. Subscribes with narrow selectors so a
// state/status event re-renders at most the header; the terminal itself is never touched by React.
import { memo, useCallback } from "react";
import { allActions } from "../actions/build-actions";
import { useStore } from "../core/store";
import { PaneFindBar } from "../overlays/pane-find-bar";
import { TerminalHost } from "../terminals/terminal-host";
import { findInPane, scrollbackDepth } from "../terminals/terminal-registry";
import { PaneHeader } from "./pane-header";
import { PaneKeybar } from "./pane-keybar";
import { ReviewBanner } from "./review-banner";
import { StoppedPane } from "./stopped-pane";

export const PaneFrame = memo(function PaneFrame({ paneId }: { paneId: string }) {
  const live = useStore((s) => s.paneById.has(paneId));
  const focused = useStore((s) => s.ui.focusedPane === paneId);
  const finding = useStore((s) => s.ui.findPane === paneId);
  const done = useStore((s) => s.paneById.get(paneId)?.state === "done");
  const find = useCallback((q: string, step?: boolean, dir?: number) => findInPane(paneId, q, true, step ? dir : 0), [paneId]);
  const depth = useCallback(() => scrollbackDepth(paneId), [paneId]);
  const close = useCallback(() => allActions.find({ paneId }), [paneId]);

  if (!live) return <StoppedPane paneId={paneId} />;
  return (
    <div className={"pane" + (focused ? " focus" : "")} data-pane={paneId} onMouseDown={() => allActions.focusPane(paneId, true)}>
      <PaneHeader paneId={paneId} />
      {finding ? <PaneFindBar find={find} depth={depth} onClose={close} /> : null}
      {done ? <ReviewBanner paneId={paneId} /> : null}
      <TerminalHost paneId={paneId} />
      <PaneKeybar paneId={paneId} />
    </div>
  );
});
