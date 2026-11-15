// "Pick up where you left off?" - offered once per stopped pane after the daemon restarts.
import { useState } from "react";
import { getActions } from "../core/keys";
import { useStore } from "../core/store";
import { KindIcon } from "../ui/atoms/kind-icon";
import { closeModal, openModal } from "./modal-store";
import { unaskedStopped, type StoppedLike } from "./restore-logic";

const asked = new Set<string>(); // module scope: survives re-renders and resyncs for the whole session

function Restore({ stopped }: { stopped: StoppedLike[] }) {
  const [on, setOn] = useState(() => new Set(stopped.filter((s) => s.kind !== "shell").map((s) => s.id)));
  const toggle = (id: string) => setOn((prev) => { const n = new Set(prev); if (!n.delete(id)) n.add(id); return n; });
  const n = on.size;
  return (
    <>
      <div className="rhead">
        <div className="rt1">Pick up where you left off?</div>
        <div className="rt2">Your computer restarted, so these agents stopped. Drover can start them again and resume their sessions. Layout, tabs and worktrees are already restored.</div>
      </div>
      <div className="rlist">
        {stopped.map((s) => (
          <label className="rr" key={s.id}>
            <input type="checkbox" checked={on.has(s.id)} onChange={() => toggle(s.id)} />
            <KindIcon kind={s.kind} />
            <span className="grow">{s.name}</span>
            <span className="mono meta">{s.kind === "shell" ? "new shell, same folder" : s.resume || s.command}</span>
          </label>
        ))}
      </div>
      <div className="mfoot">
        <span className="grow" />
        <button className="btn" onClick={() => { closeModal(); getActions().discard?.(null); }}>Start fresh</button>
        <button className="btn pri" disabled={!n} onClick={() => { closeModal(); getActions().resume?.(stopped.filter((s) => on.has(s.id)).map((s) => s.id)); }}>
          Resume {n} agent{n === 1 ? "" : "s"}
        </button>
      </div>
    </>
  );
}

export function maybeShowRestore(): void {
  const stopped = unaskedStopped((useStore.getState().raw.stopped || []) as StoppedLike[], asked);
  if (!stopped.length) return;
  stopped.forEach((s) => asked.add(s.id));
  openModal({ label: "Pick up where you left off?", size: "sm", body: <Restore stopped={stopped} /> });
}
