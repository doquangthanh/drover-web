// Mounts the shared Ace element inside `.fedit` (re-parenting, like terminals) and opens the document in it.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { errorToast } from "../core/toast-store";
import { applyGoto, getEditor, layout, openDoc } from "./ace-editor-registry";

interface Props { docKey: string; path: string; text: string; mtime: number; editable: boolean; children?: ReactNode }

export function AceHost({ docKey, path, text, mtime, editable, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef({ path, text, mtime });
  latest.current = { path, text, mtime };
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let dead = false;
    getEditor().then(({ el, editor }) => {
      const host = ref.current;
      if (dead || !host) return;
      if (el.parentElement !== host) host.insertBefore(el, host.firstChild);
      const l = latest.current;
      openDoc(editor, docKey, l.path, l.text, l.mtime, editable);
      layout();
      applyGoto(editor, docKey);
      setReady(true);
    }).catch(errorToast);
    return () => { dead = true; };
  }, [docKey, editable]);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const ro = new ResizeObserver(layout);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="fedit" ref={ref}>
      {ready ? null : <div className="meta" style={{ padding: 14 }}>Loading editor…</div>}
      {children}
    </div>
  );
}
