// Right panel of the Files view: header (name, dirty, stale, tabs, save) and the editor or the diff of the open file.
import { useSyncExternalStore } from "react";
import type { Space } from "../core/protocol-types";
import { DiffView } from "../changes/diff-view";
import { dirtySignature, isDirtyIn, subscribeDocs } from "./ace-editor-registry";
import { AceHost } from "./ace-host";
import { FileIcon } from "./file-icon";
import { patchFileUi, type FileUi } from "./files-store";
import { CHANGED, docKey, type FileContent, type FileDiff } from "./use-files-data";

const Note = ({ text, cls = "meta" }: { text: string; cls?: string }) => <div className={cls} style={{ padding: 14 }}>{text}</div>;

interface Props {
  space: Space; ui: FileUi; file: string; status: Record<string, string>; content: FileContent | null; diff: FileDiff | null;
  stale: boolean; onSave: () => void; onDiscard: () => void;
}

function EditorBody({ space, file, content }: { space: Space; file: string; content: FileContent | null }) {
  if (!content) return <Note text="Loading…" />;
  if (content.error) return <Note text={content.error} cls="errtext" />;
  if (content.binary) return <Note text={`Binary file · ${((content.size ?? 0) / 1024).toFixed(1)} KB — not shown.`} />;
  return (
    <AceHost docKey={docKey(space, file)} path={file} text={content.text ?? ""} mtime={content.mtime_us ?? 0} editable={!!content.editable}>
      {!content.editable ? <div className="warnbar">{`Read-only: ${content.why_readonly}.`}</div> : null}
    </AceHost>
  );
}

export function FileEditorPane({ space, ui, file, status, content, diff, stale, onSave, onDiscard }: Props) {
  const dirty = isDirtyIn(useSyncExternalStore(subscribeDocs, dirtySignature), docKey(space, file));
  const changed = CHANGED.has(status[file]);
  const seg = (label: string, tab: "file" | "diff") => (
    <button className={"seg" + (ui.tab === tab ? " on" : "")} onClick={() => patchFileUi(space.id, { tab })}>{label}</button>
  );
  const showDiff = ui.tab === "diff" && changed;
  const editable = ui.tab === "file" && !!content?.editable;
  return (
    <div className="panel focus grow" style={{ minWidth: 0 }}>
      <div className="ph">
        <button className="btn mobile-only" aria-label="Back to files" onClick={() => patchFileUi(space.id, { stage: "tree" })}>‹</button>
        <FileIcon name={file.split("/").pop() || file} />
        <span className="mono trunc">{file}</span>
        {dirty ? <span className="fdirty" title="Unsaved changes">●</span> : null}
        <span className="grow" />
        {stale ? <span className="meta" style={{ color: "var(--blocked)" }}>Changed on disk</span> : null}
        {stale ? <button className="btn" title="Discard your edits and load the disk version" onClick={onDiscard}>Reload</button> : null}
        {changed ? <>{seg("File", "file")}{seg("Diff", "diff")}</> : null}
        {editable ? <button className="btn pri" disabled={!dirty} title="Save (Ctrl+S)" onClick={onSave}>Save</button> : null}
      </div>
      <div className="fview" style={{ flex: 1, minHeight: 0, overflow: ui.tab === "file" ? "hidden" : "auto" }}>
        {showDiff
          ? (diff?.error ? <Note text={diff.error} cls="errtext" /> : <DiffView text={diff?.diff} />)
          : <EditorBody space={space} file={file} content={content} />}
      </div>
    </div>
  );
}
