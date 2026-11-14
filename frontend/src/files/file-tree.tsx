// Left panel of the Files view: all files (lazy folders) or only the changed ones.
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Space } from "../core/protocol-types";
import { dirtySignature, isDirtyIn, subscribeDocs } from "./ace-editor-registry";
import { ChangedRow, FileTreeRow } from "./file-tree-row";
import { docKey, type Entry } from "./use-files-data";
import { patchFileUi, type FileUi } from "./files-store";

interface Props {
  space: Space; ui: FileUi; dirs: Record<string, Entry[]>; status: Record<string, string>; isRepo: boolean;
  onPickFile: (path: string) => void; onToggleDir: (path: string) => void; onRevealDir: (path: string) => void;
  onNewFile: () => void; onReload: () => void;
}

export function FileTree({ space, ui, dirs, status, isRepo, onPickFile, onToggleDir, onRevealDir, onNewFile, onReload }: Props) {
  const dirty = useSyncExternalStore(subscribeDocs, dirtySignature);
  const open = useMemo(() => new Set(ui.open), [ui.open]);
  const changed = useMemo(() => Object.entries(status).sort(([a], [b]) => a.localeCompare(b)), [status]);
  const changedPaths = useMemo(() => Object.keys(status), [status]);

  const rows = useMemo(() => {
    const out: { e: Entry; depth: number }[] = [];
    const walk = (path: string, depth: number) => {
      for (const e of dirs[path] || []) { out.push({ e, depth }); if (e.dir && open.has(e.path)) walk(e.path, depth + 1); }
    };
    walk("", 0);
    return out;
  }, [dirs, open]);

  const pick = useCallback((path: string, dir: boolean) => (dir ? onToggleDir(path) : onPickFile(path)), [onPickFile, onToggleDir]);
  const pickChanged = useCallback((path: string, dir: boolean) => (dir ? onRevealDir(path) : onPickFile(path)), [onPickFile, onRevealDir]);
  const seg = (label: string, only: boolean) => (
    <button className={"seg" + (ui.only === only ? " on" : "")} onClick={() => patchFileUi(space.id, { only })}>{label}</button>
  );

  return (
    <div className="panel" style={{ width: "320px", flex: "none" }}>
      <div className="ph">
        <b className="trunc">{space.name}</b><span className="grow" />
        {seg("All", false)}{seg(`Changed${changed.length ? ` ${changed.length}` : ""}`, true)}
        <button className="btn" title="New file" onClick={onNewFile}>+</button>
        <button className="btn" title="Reload" onClick={onReload}>↻</button>
      </div>
      <div className="pb-body ftree">
        {ui.only
          ? changed.map(([p, s]) => <ChangedRow key={p} path={p} status={s} selected={(p.endsWith("/") ? p.slice(0, -1) : p) === ui.file} onPick={pickChanged} />)
          : rows.map(({ e, depth }) => (
            <FileTreeRow key={e.path} name={e.name} path={e.path} dir={e.dir} open={e.dir && open.has(e.path)} depth={depth}
              selected={e.path === ui.file} status={e.dir ? (status[e.path + "/"] ? "?" : null) : status[e.path] || null}
              dirChanged={e.dir && changedPaths.some((k) => k.startsWith(e.path + "/"))}
              dirty={!e.dir && isDirtyIn(dirty, docKey(space, e.path))} onPick={pick} />))}
        {ui.only && !changed.length
          ? <div className="meta" style={{ padding: 10 }}>{isRepo ? "No changes — working tree is clean." : "Not a git repository."}</div> : null}
      </div>
    </div>
  );
}
