import { memo } from "react";
import { FileIcon } from "./file-icon";

const BADGE: Record<string, string> = { M: "M", A: "A", D: "D", R: "R", "?": "U" };

export function StatusBadge({ s }: { s: string }) {
  return <span className={`fb ${s === "?" ? "U" : s}`}>{BADGE[s] ?? s}</span>;
}

interface RowProps {
  name: string; path: string; dir: boolean; open: boolean; depth: number; selected: boolean;
  status: string | null; dirChanged: boolean; dirty: boolean; onPick: (path: string, dir: boolean) => void;
}

export const FileTreeRow = memo(function FileTreeRow(p: RowProps) {
  return (
    <button className={"fileitem" + (p.selected ? " on" : "")} style={{ paddingLeft: `${10 + p.depth * 14}px` }} title={p.path}
      onClick={() => p.onPick(p.path, p.dir)}>
      <span className="caret">{p.dir ? (p.open ? "▾" : "▸") : ""}</span>
      <FileIcon name={p.name} dir={p.dir} open={p.open} />
      <span className="mono grow trunc">{p.name}</span>
      {p.dirty ? <span className="fdirty" title="Unsaved changes">●</span> : null}
      {p.status ? <StatusBadge s={p.status} /> : p.dirChanged ? <span className="fdot" /> : null}
    </button>
  );
});

/** A row of the "Changed" list: a changed file, or an untracked folder (path ends with "/"). */
export const ChangedRow = memo(function ChangedRow({ path, status, selected, onPick }: {
  path: string; status: string; selected: boolean; onPick: (clean: string, dir: boolean) => void;
}) {
  const dir = path.endsWith("/"), clean = dir ? path.slice(0, -1) : path;
  return (
    <button className={"fileitem" + (selected ? " on" : "")} title={clean} onClick={() => onPick(clean, dir)}>
      <FileIcon name={clean.split("/").pop() || clean} dir={dir} />
      <span className="mono grow trunc">{clean}</span>
      <StatusBadge s={status} />
    </button>
  );
});
