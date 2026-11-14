// Files view data: directory listings, git status, the open file's content/diff, save, 3s polling while mounted.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { conn } from "../core/connection";
import type { Space } from "../core/protocol-types";
import { machineAlias } from "../core/store-derive";
import { errorToast, toast } from "../core/toast-store";
import { confirmBox } from "../overlays/modal-dialogs";
import { getDoc, isDirty, markSaved, reloadDoc } from "./ace-editor-registry";
import { expandFolders, getFileUi, parentFolders, patchFileUi } from "./files-store";

export interface Entry { name: string; path: string; dir: boolean }
export interface FileContent {
  error?: string; binary?: boolean; size?: number; text?: string; mtime_us?: number; editable?: boolean; why_readonly?: string;
}
export interface FileDiff { diff: string; error?: string }
export interface FilesData {
  dirs: Record<string, Entry[]>; status: Record<string, string>; isRepo: boolean;
  content: FileContent | null; diff: FileDiff | null; stale: boolean; ready: boolean; error: string | null;
}

export const CHANGED = new Set(["M", "A", "D", "R"]);
const INITIAL: FilesData = { dirs: {}, status: {}, isRepo: false, content: null, diff: null, stale: false, ready: false, error: null };

export const docKey = (space: Space, path: string) => `${space.id}:${path}`;

/** Disk vs editor: a clean document follows the disk; one with unsaved edits is flagged instead of overwritten. */
function syncDoc(space: Space, file: string, c: FileContent): boolean {
  const key = docKey(space, file), doc = c.error || c.binary ? undefined : getDoc(key);
  if (!doc || c.mtime_us === doc.mtime) return false;
  if (isDirty(key)) return true;
  reloadDoc(key, c.text ?? "", c.mtime_us ?? 0);
  return false;
}

export function useFilesData(spaceIn: Space) {
  // Space objects change on every branch/dirty update; only these fields matter here, so keep one identity.
  const space = useMemo(() => spaceIn, [spaceIn.id, spaceIn.cwd, spaceIn.machine]); // eslint-disable-line react-hooks/exhaustive-deps
  const [data, setData] = useState<FilesData>(INITIAL);
  const ref = useRef(data);
  ref.current = data;
  const patch = useCallback((p: Partial<FilesData>) => setData((d) => ({ ...d, ...p })), []);
  const machine = machineAlias(space);
  const call = useCallback(<T,>(method: string, params: Record<string, unknown> = {}) =>
    conn.rpc<T>(method, { ...params, ...(machine ? { machine } : {}) }), [machine]);
  const isCurrent = (path: string) => getFileUi(space.id).file === path;

  const readFile = useCallback(async (path: string): Promise<FileContent> => {
    try { return await call<FileContent>("files.read", { space: space.id, path }); } catch (e) { return { error: (e as Error).message }; }
  }, [call, space.id]);
  const readDiff = useCallback(async (path: string, status: Record<string, string>): Promise<FileDiff | null> => {
    if (!CHANGED.has(status[path])) return null;
    try { return await call<FileDiff>("worktree.diff", { path: space.cwd, base: "HEAD", file: path }); } catch (e) { return { diff: "", error: (e as Error).message }; }
  }, [call, space.cwd]);

  const loadDir = useCallback(async (path: string) => {
    const r = await call<{ entries: Entry[] }>("files.list", { space: space.id, path });
    setData((d) => ({ ...d, dirs: { ...d.dirs, [path]: r.entries } }));
  }, [call, space.id]);

  const openFile = useCallback(async (path: string) => {
    patchFileUi(space.id, { file: path, stage: "file" });
    patch({ content: null, diff: null, stale: false });
    const [content, diff] = await Promise.all([readFile(path), readDiff(path, ref.current.status)]);
    if (!isCurrent(path)) return;
    patch({ content, diff, stale: syncDoc(space, path, content) });
    patchFileUi(space.id, { tab: content.error && CHANGED.has(ref.current.status[path]) ? "diff" : "file" }); // a deleted file can only show its diff
  }, [space, readFile, readDiff, patch]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Poll: status always; folders/content/diff only when something changed (or `force`). */
  const refresh = useCallback(async (force = false) => {
    const prev = ref.current;
    const s = await call<{ is_repo: boolean; files: Record<string, string> }>("files.status", { space: space.id });
    const statusChanged = JSON.stringify(prev.status) !== JSON.stringify(s.files);
    const p: Partial<FilesData> = {};
    if (statusChanged || prev.isRepo !== s.is_repo) { p.status = s.files; p.isRepo = s.is_repo; }
    if (force || statusChanged) {
      const dirs = { ...prev.dirs };
      await Promise.all(Object.keys(dirs).map((path) => call<{ entries: Entry[] }>("files.list", { space: space.id, path })
        .then((r) => { dirs[path] = r.entries; }).catch(() => { delete dirs[path]; })));
      p.dirs = dirs;
    }
    const file = getFileUi(space.id).file;
    if (file) {
      const [content, diff] = await Promise.all([readFile(file), readDiff(file, s.files)]);
      if (isCurrent(file)) {
        const stale = syncDoc(space, file, content);
        if (force || content.mtime_us !== prev.content?.mtime_us || content.error !== prev.content?.error || stale !== prev.stale) { p.content = content; p.stale = stale; }
        if (JSON.stringify(diff) !== JSON.stringify(prev.diff)) p.diff = diff;
      }
    }
    if (Object.keys(p).length) patch(p);
  }, [call, space, readFile, readDiff, patch]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(async (force = false): Promise<void> => {
    const path = getFileUi(space.id).file, doc = path ? getDoc(docKey(space, path)) : undefined;
    if (!path || !doc || !doc.editable) return;
    try {
      const r = await call<{ mtime_us: number }>("files.write", { space: space.id, path, text: doc.session.getValue(), base_mtime_us: doc.mtime, force });
      markSaved(docKey(space, path), r.mtime_us);
      toast("Saved", path);
      await refresh(true);
    } catch (e) {
      if (!/changed on disk/.test((e as Error).message)) { errorToast(e); return; }
      if (await confirmBox("File changed on disk", "Something else (an agent?) changed this file after you opened it. Overwrite it with your version?", "Overwrite", true)) await save(true);
    }
  }, [call, space, refresh]);

  const createFile = useCallback(async (path: string) => {
    try {
      await call("files.write", { space: space.id, path, text: "", create: true });
      expandFolders(space.id, parentFolders(path));
      await refresh(true);
      await openFile(path);
    } catch (e) { errorToast(e); }
  }, [call, space.id, refresh, openFile]);

  /** Reload the open file from disk, dropping local edits. */
  const discardEdits = useCallback(() => {
    const { content } = ref.current, file = getFileUi(space.id).file;
    if (!file || !content) return;
    reloadDoc(docKey(space, file), content.text ?? "", content.mtime_us ?? 0);
    patch({ stale: false });
  }, [space, patch]);

  // Initial load: root listing, status, every folder that was open before, and the selected file.
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const ui = getFileUi(space.id);
        const [root, s] = await Promise.all([
          call<{ entries: Entry[] }>("files.list", { space: space.id, path: "" }),
          call<{ is_repo: boolean; files: Record<string, string> }>("files.status", { space: space.id }),
        ]);
        const dirs: Record<string, Entry[]> = { "": root.entries };
        await Promise.all(ui.open.map((p) => call<{ entries: Entry[] }>("files.list", { space: space.id, path: p }).then((r) => { dirs[p] = r.entries; }).catch(() => {})));
        const content = ui.file ? await readFile(ui.file) : null;
        const diff = ui.file ? await readDiff(ui.file, s.files) : null;
        if (!dead) patch({ dirs, status: s.files, isRepo: s.is_repo, content, diff, stale: ui.file && content ? syncDoc(space, ui.file, content) : false, ready: true });
      } catch (e) { if (!dead) patch({ error: (e as Error).message }); }
    })();
    return () => { dead = true; };
  }, [call, space, readFile, readDiff, patch]);

  // The agents are editing these files right now: look for changes every few seconds while this view is open.
  useEffect(() => {
    if (!data.ready) return;
    const timer = setInterval(() => { if (!document.hidden) refresh().catch(() => {}); }, 3000);
    return () => clearInterval(timer);
  }, [data.ready, refresh]);

  return { data, loadDir, openFile, refresh, save, createFile, discardEdits };
}
