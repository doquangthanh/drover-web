// An agent's terminal docked beside the editor in the Files view, so code and agent are on screen together.
// The workspace keeps its terminals mounted, so the xterm element is borrowed and handed back where it came from.
import { useLayoutEffect, useMemo, useRef } from "react";
import type { Space } from "../core/protocol-types";
import { useStore } from "../core/store";
import { sortedPanesOf } from "../shell/shell-logic";
import { getTerminal } from "../terminals/terminal-registry";
import { scheduleFit } from "../terminals/terminal-fit";
import { patchFileUi, type FileUi } from "./files-store";
import { pickAgentPane } from "./send-to-agent-logic";

function DockTerminal({ paneId }: { paneId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host) return;
    const entry = getTerminal(paneId);
    const home = entry.el.parentNode, next = entry.el.nextSibling;
    host.appendChild(entry.el);
    requestAnimationFrame(() => scheduleFit(entry));
    return () => {
      if (entry.el.parentNode === host) host.removeChild(entry.el);
      if (home && home.isConnected) home.insertBefore(entry.el, next && next.parentNode === home ? next : null);
      requestAnimationFrame(() => scheduleFit(entry));
    };
  }, [paneId]);
  return <div ref={ref} className="adock-term" />;
}

export function AgentDock({ space, ui }: { space: Space; ui: FileUi }) {
  const panes = useStore((s) => s.panes);
  const focused = useStore((s) => s.ui.focusedPane);
  const list = useMemo(() => sortedPanesOf(panes, space.id).filter((p) => p.state !== "exited"), [panes, space.id]);
  const current = list.find((p) => p.id === ui.dockPane) ?? pickAgentPane(panes, space.id, focused) ?? list[0];
  if (!current) return null;
  if (ui.dock === false) {
    return <button className="adock-tab" title="Show the agent beside the editor" onClick={() => patchFileUi(space.id, { dock: true })}>Agent ▸</button>;
  }
  const label = (p: { name?: string; kind?: string }) => p.name || p.kind || "terminal";
  return (
    <div className="panel adock" onMouseDown={() => useStore.getState().setUi({ focusedPane: current.id })}>
      <div className="ph">
        {current.state === "working" ? <span className="spin" /> : <span className={"dot " + (current.state === "idle" ? "" : current.state)} />}
        {list.length > 1
          ? <select className="adock-pick" aria-label="Agent shown beside the editor" value={current.id}
            onChange={(e) => patchFileUi(space.id, { dockPane: e.target.value })}>
            {list.map((p) => <option key={p.id} value={p.id}>{`${label(p)} · ${p.state}`}</option>)}
          </select>
          : <span className="adock-name">{label(current)}</span>}
        <span className="grow" />
        <button className="ibtn" aria-label="Hide the agent" title="Hide" onClick={() => patchFileUi(space.id, { dock: false })}>✕</button>
      </div>
      <DockTerminal paneId={current.id} />
    </div>
  );
}
