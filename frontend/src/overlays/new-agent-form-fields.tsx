// Presentational pieces of the New agent dialog (state lives in new-agent-dialog.tsx).
import { Icon } from "../ui/atoms/icon";
import { KindIcon } from "../ui/atoms/kind-icon";
import { AGENTS, worktreePath, worktreeSlug, type AgentKind, type Placement } from "./new-agent-logic";

export interface GitInfo { is_repo?: boolean; branch?: string; dirty?: number; root?: string }

export function AgentChips({ kind, onKind }: { kind: AgentKind; onKind: (k: AgentKind) => void }) {
  return (
    <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
      {AGENTS.map(([k, label]) => (
        <button key={k} type="button" className={`chip${kind === k ? " on" : ""}`} onClick={() => onKind(k)}>
          {k !== "custom" ? <KindIcon kind={k} /> : null}{label}
        </button>
      ))}
    </div>
  );
}

export function FolderField({ cwd, recent, note, onCwd, onCommit, onChoose }: {
  cwd: string; recent: string[]; note: { text: string; ok: boolean };
  onCwd: (v: string) => void; onCommit: (v: string) => void; onChoose: () => void;
}) {
  return (
    <div>
      <label className="lab" htmlFor="na-cwd">Folder</label>
      <div className="row">
        <input className="in mono" id="na-cwd" value={cwd} placeholder="Folder" onChange={(e) => onCwd(e.target.value)}
          onBlur={(e) => onCommit(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onCommit(e.currentTarget.value); }} />
        <button className="btn" type="button" onClick={onChoose}><Icon name="folder" />Choose…</button>
      </div>
      <div className="row" style={{ flexWrap: "wrap", marginTop: 6 }}>
        {recent.length ? <span className="meta">Recent</span> : null}
        {recent.map((r) => <button key={r} className="chip sm" type="button" title={r} onClick={() => onCommit(r)}>{r.split(/[\\/]/).pop()}</button>)}
        <span className={`gitnote${note.ok ? " ok" : ""}`}>{note.text}</span>
      </div>
    </div>
  );
}

export function WorktreeBox({ checked, disabled, info, name, kind, onChange }: {
  checked: boolean; disabled: boolean; info: GitInfo | null; name: string; kind: string; onChange: (v: boolean) => void;
}) {
  const slug = worktreeSlug(name, kind);
  return (
    <div className="box">
      <label className="ck"><input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />Work in a new git worktree</label>
      <div className="na-wt" hidden={!checked || !info?.is_repo}>
        branch <span className="mono ac">dr/{slug}</span> from <span className="mono">{info?.branch || "HEAD"}</span> → <span className="mono">{worktreePath(info?.root, slug)}</span>
      </div>
    </div>
  );
}

export function PlacementRadios({ place, onPlace }: { place: Placement; onPlace: (p: Placement) => void }) {
  const radio = (value: Placement, label: string) => (
    <label className="ck"><input type="radio" name="na-place" value={value} checked={place === value} onChange={() => onPlace(value)} />{label}</label>
  );
  return <div className="row" style={{ gap: 18 }}>{radio("tab", "New tab")}{radio("split", "Split current pane")}{radio("background", "Background")}</div>;
}
