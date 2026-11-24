// Files: folder tree of the current space, a code editor (Ace, loaded on first open), and which files changed.
import { useCallback, useEffect } from "react";
import { useStore } from "../core/store";
import type { Space } from "../core/protocol-types";
import { useIsPhone } from "../core/viewport";
import { confirmBox, promptText } from "../overlays/modal-dialogs";
import { dropDoc, isDirty, setSaveHandler, setSendHandler } from "./ace-editor-registry";
import { sendSelectionToAgent } from "./send-to-agent";
import { AgentDock } from "./agent-dock";
import { FileEditorPane } from "./file-editor-pane";
import { FileTree } from "./file-tree";
import { closeTab, withTab } from "./file-tabs-logic";
import { DEFAULT_UI, expandFolders, getFileUi, patchFileUi, useFilesUi } from "./files-store";
import { docKey, useFilesData } from "./use-files-data";

function FilesBody({ space }: { space: Space }) {
  const ui = useFilesUi((s) => s.bySpace[space.id]) ?? DEFAULT_UI;
  const phone = useIsPhone();
  const { data, loadDir, openFile, refresh, save, createFile, discardEdits } = useFilesData(space);

  useEffect(() => { setSaveHandler(() => { void save(); }); return () => setSaveHandler(null); }, [save]);
  useEffect(() => { setSendHandler(() => sendSelectionToAgent(space)); return () => setSendHandler(null); }, [space]);

  // Every file that gets selected (tree, terminal link, tab) is kept as a tab.
  useEffect(() => {
    if (ui.file && !(ui.tabs ?? []).includes(ui.file)) patchFileUi(space.id, { tabs: withTab(ui.tabs, ui.file) });
  }, [space.id, ui.file, ui.tabs]);

  const closeFileTab = useCallback(async (path: string) => {
    const cur = getFileUi(space.id);
    if (isDirty(docKey(space, path)) && !(await confirmBox("Close without saving?", `${path} has changes that are not saved.`, "Close and discard", true))) return;
    const next = closeTab(withTab(cur.tabs, path), path, cur.file);
    dropDoc(docKey(space, path));
    patchFileUi(space.id, { tabs: next.tabs, file: next.file });
    if (next.file && next.file !== cur.file) void openFile(next.file);
  }, [space, openFile]);

  const toggleDir = useCallback(async (path: string) => {
    const cur = useFilesUi.getState().bySpace[space.id] ?? DEFAULT_UI;
    if (cur.open.includes(path)) { patchFileUi(space.id, { open: cur.open.filter((p) => p !== path) }); return; }
    expandFolders(space.id, [path]);
    if (!data.dirs[path]) await loadDir(path).catch(() => {});
  }, [space.id, data.dirs, loadDir]);

  // An untracked folder in the Changed list: jump into the full tree, open down to it.
  const revealDir = useCallback(async (path: string) => {
    const parts = path.split("/"), chain = parts.map((_, i) => parts.slice(0, i + 1).join("/"));
    patchFileUi(space.id, { only: false });
    expandFolders(space.id, chain);
    await Promise.all(chain.filter((p) => !data.dirs[p]).map((p) => loadDir(p).catch(() => {})));
  }, [space.id, data.dirs, loadDir]);

  const newFile = useCallback(async () => {
    const dir = ui.file && ui.file.includes("/") ? ui.file.slice(0, ui.file.lastIndexOf("/") + 1) : "";
    const path = ((await promptText("New file", dir, "path inside this space, e.g. src/utils.py")) || "").trim().replace(/^\/+/, "");
    if (path) await createFile(path);
  }, [ui.file, createFile]);

  if (data.error) return <div className="view errtext">{data.error}</div>;
  if (!data.ready) return <div className="view meta">Loading files…</div>;

  const tree = (
    <FileTree space={space} ui={ui} dirs={data.dirs} status={data.status} isRepo={data.isRepo} onPickFile={openFile}
      onToggleDir={toggleDir} onRevealDir={revealDir} onNewFile={newFile} onReload={() => { void refresh(true); }} />
  );
  const viewer = ui.file ? (
    <FileEditorPane space={space} ui={ui} file={ui.file} status={data.status} content={data.content} diff={data.diff}
      stale={data.stale} onSave={() => { void save(); }} onDiscard={discardEdits} onSend={() => sendSelectionToAgent(space)}
      tabs={withTab(ui.tabs, ui.file)} onPickTab={(p) => { void openFile(p); }} onCloseTab={(p) => { void closeFileTab(p); }} />
  ) : <div className="panel grow"><div className="meta" style={{ padding: 14 }}>Pick a file on the left to read or edit it.</div></div>;

  const showFile = phone && ui.file && ui.stage === "file";
  return <div className="vsplit">{phone ? (showFile ? viewer : tree) : <>{tree}{viewer}<AgentDock space={space} ui={ui} /></>}</div>;
}

export default function FilesView() {
  const space = useStore((s) => (s.ui.spaceId ? s.spaceById.get(s.ui.spaceId) : undefined));
  if (!space) return <div className="view meta">Open a space first.</div>;
  return <FilesBody key={space.id} space={space} />;
}
