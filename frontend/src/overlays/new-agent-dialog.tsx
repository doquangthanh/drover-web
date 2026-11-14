// "New agent" dialog: agent kind, machine, folder (native or in-app picker), worktree, placement, first prompt.
import { useEffect, useRef, useState } from "react";
import { getActions } from "../core/keys";
import { conn } from "../core/connection";
import type { Machine } from "../core/protocol-types";
import { useStore } from "../core/store";
import { errorToast } from "../core/toast-store";
import { chooseFolder } from "./folder-picker-dialog";
import { AgentChips, FolderField, PlacementRadios, WorktreeBox, type GitInfo } from "./new-agent-form-fields";
import { buildCommand, cliPreview, createParams, type AgentKind, type Placement } from "./new-agent-logic";
import { closeModal, openModal } from "./modal-store";

export interface NewAgentOpts { kind?: AgentKind; machine?: string | null; cwd?: string; worktree?: boolean; place?: Placement }

function NewAgent({ opts }: { opts: NewAgentOpts }) {
  const initial = useRef(useStore.getState()).current; // dialog defaults come from the state at open time
  const focused = initial.ui.focusedPane ? initial.paneById.get(initial.ui.focusedPane) : undefined;
  const space = initial.ui.spaceId ? initial.spaceById.get(initial.ui.spaceId) : undefined;
  const machines = useStore((s) => s.raw.machines) as Machine[] | undefined;
  const spaces = useStore((s) => s.spaces);

  const [kind, setKind] = useState<AgentKind>(opts.kind || "claude");
  const [machine, setMachine] = useState<string | null>(opts.machine ?? (space?.machine && space.machine !== "local" ? space.machine : null));
  const [cwd, setCwd] = useState(opts.cwd || space?.cwd || focused?.cwd || "");
  const [name, setName] = useState("");
  const [custom, setCustom] = useState("");
  const [args, setArgs] = useState("");
  const [prompt, setPrompt] = useState("");
  const [worktree, setWorktree] = useState(!!opts.worktree);
  const [place, setPlace] = useState<Placement>(opts.place || "tab");
  const [info, setInfo] = useState<GitInfo | null>(null);
  const [note, setNote] = useState({ text: "", ok: false });
  const gitSeq = useRef(0);

  const checkGit = async (path: string, on: string | null) => {
    const seq = ++gitSeq.current;
    path = path.trim();
    setNote({ text: "", ok: false });
    if (!path) { setInfo(null); return; }
    try {
      const r: GitInfo = await conn.rpc("git.info", on ? { path, machine: on } : { path });
      if (seq !== gitSeq.current) return;
      setInfo(r);
      setNote({ text: r.is_repo ? `✓ git repo · ${r.branch}${r.dirty ? ` · ${r.dirty} uncommitted` : ""}` : "not a git repo", ok: !!r.is_repo });
      if (!r.is_repo) setWorktree(false);
    } catch (e) { if (seq === gitSeq.current) { setNote({ text: (e as Error).message, ok: false }); setInfo(null); } }
  };
  const commit = (path: string) => { setCwd(path); void checkGit(path, machine); };
  useEffect(() => { void checkGit(cwd, machine); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once, on open

  const command = buildCommand(kind, custom, args);
  const recent = [...new Set(spaces.map((s) => s.cwd).filter((c): c is string => !!c))].slice(0, 5);

  const start = async () => {
    const params = createParams({ command, cwd, name, kind, machine, worktree, place, focused });
    try {
      const pane = await conn.rpc("pane.create", params);
      closeModal();
      if (place !== "background") getActions().focusPane?.(pane.id);
      const text = prompt.trim();
      if (text) {
        conn.rpc("pane.wait", { pane: pane.id, states: ["idle", "blocked"], timeout: 25 }).catch(() => {})
          .finally(() => conn.rpc("pane.send", { pane: pane.id, text }).catch(errorToast));
      }
    } catch (e) { errorToast(e); }
  };

  return (
    <>
      <div className="mhead">
        <h2>New agent</h2>
        <span className="meta">{space ? `in ${space.name} · ${machine || "This computer"}` : ""}</span>
      </div>
      <div className="mbody">
        <div>
          <span className="lab">Agent</span>
          <AgentChips kind={kind} onKind={setKind} />
          <input className="in mono" placeholder="command to run" aria-label="Custom command" hidden={kind !== "custom"}
            value={custom} onChange={(e) => setCustom(e.target.value)} />
        </div>
        <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
          <div className="grow"><label className="lab" htmlFor="na-name">Name</label>
            <input className="in" id="na-name" placeholder="e.g. discount codes" autoFocus value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grow"><label className="lab" htmlFor="na-m">Machine</label>
            <select className="in" id="na-m" value={machine || ""} onChange={(e) => { const m = e.target.value || null; setMachine(m); setCwd(""); void checkGit("", m); }}>
              <option value="">This computer</option>
              {(machines || []).filter((m) => m.status === "connected").map((m) => <option key={m.alias} value={m.alias}>{m.alias}</option>)}
            </select></div>
        </div>
        <FolderField cwd={cwd} recent={recent} note={note} onCwd={setCwd} onCommit={commit}
          onChoose={async () => { const p = await chooseFolder(machine, cwd.trim()); if (p) commit(p); }} />
        <WorktreeBox checked={worktree} disabled={!!info && !info.is_repo} info={info} name={name} kind={kind} onChange={setWorktree} />
        <PlacementRadios place={place} onPlace={setPlace} />
        <div><label className="lab" htmlFor="na-p">First prompt</label>
          <textarea className="in" id="na-p" rows={3} placeholder="Sent once the agent is ready (optional)" value={prompt} onChange={(e) => setPrompt(e.target.value)} /></div>
        <div><label className="lab" htmlFor="na-args">Arguments</label>
          <input className="in mono" id="na-args" placeholder="extra arguments (optional)" value={args} onChange={(e) => setArgs(e.target.value)} /></div>
      </div>
      <div className="mfoot">
        <span className="mono meta grow trunc">{cliPreview(machine, worktree, command)}</span>
        <button className="btn" onClick={() => closeModal()}>Cancel</button>
        <button className="btn pri" onClick={start}>Start agent</button>
      </div>
    </>
  );
}

export function openNewAgent(opts: NewAgentOpts = {}): void {
  openModal({ label: "New agent", size: "na", body: <NewAgent opts={opts} /> });
}
