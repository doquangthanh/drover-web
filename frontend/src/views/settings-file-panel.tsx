// Editor for one config file: plain textarea, Ctrl/Cmd+S saves (validated server-side), optional scroll to a section.
import { useEffect, useRef } from "react";
import { conn } from "../core/connection";
import { errorToast, toast } from "../core/toast-store";

export interface SettingsFile { name: string; path: string; exists: boolean; text: string }

export const openPath = (path: string) => (window as any).pywebview?.api?.open_path?.(path);
export const canOpenPath = () => !!(window as any).pywebview?.api?.open_path;

interface Props { file: SettingsFile; errors: string[]; marker?: string; withTest?: boolean; onSaved: () => void }

export function SettingsFilePanel({ file, errors, marker, withTest, onSaved }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const save = async () => {
    try {
      await conn.rpc("settings.write", { name: file.name, text: ref.current?.value ?? "" });
      toast(`Saved ${file.name}`, "herd reloads it within 2 seconds.");
      onSaved();
    } catch (e) { errorToast(e); }
  };
  useEffect(() => {
    const i = marker ? file.text.indexOf(marker) : -1;
    if (i > 0 && ref.current) ref.current.scrollTop = file.text.slice(0, i).split("\n").length * 19 - 40;
  }, [file.name, file.text, marker]);

  return (
    <div className="panel">
      <div className="ph s32">
        <span className="mono grow trunc">{file.name}</span>
        <span className="meta">{file.exists ? "" : "new file"}</span>
        {withTest ? <button className="btn sm" onClick={() => conn.rpc("notify.test").catch(errorToast)}>Test notification</button> : null}
        {canOpenPath() ? <button className="btn sm" onClick={() => openPath(file.path)}>Open in editor</button> : null}
        <button className="btn sm pri" onClick={save}>Save</button>
      </div>
      {errors.filter((e) => e.startsWith(file.name)).map((e, i) => <div key={i} className="errtext" style={{ padding: "6px 12px" }}>{e}</div>)}
      {/* Keyed by content: after a save/reload the textarea resets to the stored text. */}
      <textarea key={file.name + file.text.length} ref={ref} className="in code" spellCheck={false} aria-label={file.name} defaultValue={file.text}
        onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); } }} />
    </div>
  );
}
