// A pane that stopped when the computer restarted: no terminal, just resume / start fresh / close.
import { allActions } from "../actions/build-actions";
import { useStore } from "../core/store";
import { KindIcon } from "../ui/atoms/kind-icon";

export function StoppedPane({ paneId }: { paneId: string }) {
  const stopped = useStore((s) => s.stopped.find((p) => p.id === paneId));
  return (
    <div className="pane">
      <div className="phead">
        {stopped ? <KindIcon kind={String(stopped.kind || "")} /> : null}
        <span className="pn">{stopped ? String(stopped.name || paneId) : paneId}</span>
        <span className="cwd trunc">{String(stopped?.cwd || "")}</span>
      </div>
      <div className="stopped">
        This agent stopped when the computer restarted.
        <div className="row">
          <button className="btn pri" onClick={() => allActions.resume([paneId])}>Resume</button>
          <button className="btn" onClick={() => allActions.resume([paneId], true)}>Start fresh</button>
          <button className="btn" onClick={() => allActions.discard([paneId])}>Close</button>
        </div>
      </div>
    </div>
  );
}
