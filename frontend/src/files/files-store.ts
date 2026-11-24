// Files view UI state that must survive leaving and re-entering the view (per space): opened folders, selected file, tabs.
import { create } from "zustand";

export interface FileUi {
  open: string[];            // expanded folder paths
  file: string | null;
  tab: "file" | "diff";
  only: boolean;             // tree shows "Changed" list instead of all files
  stage: "tree" | "file";    // phones show the tree OR the file
  tabs?: string[];           // open files, in tab order (the selected one is `file`)
  dock?: boolean;           // an agent's terminal beside the editor (default: shown)
  dockPane?: string | null;  // which pane the dock shows (default: the focused / most urgent agent)
}

export const DEFAULT_UI: FileUi = { open: [], file: null, tab: "file", only: false, stage: "tree" };

interface FilesUiState { bySpace: Record<string, FileUi> }

export const useFilesUi = create<FilesUiState>(() => ({ bySpace: {} }));

export const getFileUi = (spaceId: string): FileUi => useFilesUi.getState().bySpace[spaceId] ?? DEFAULT_UI;

export function patchFileUi(spaceId: string, patch: Partial<FileUi>): void {
  useFilesUi.setState((s) => ({ bySpace: { ...s.bySpace, [spaceId]: { ...(s.bySpace[spaceId] ?? DEFAULT_UI), ...patch } } }));
}

/** Add `paths` to the expanded folders. */
export function expandFolders(spaceId: string, paths: string[]): void {
  const open = new Set(getFileUi(spaceId).open);
  paths.forEach((p) => open.add(p));
  patchFileUi(spaceId, { open: [...open] });
}

/** "a/b/c.txt" -> ["a", "a/b"] */
export function parentFolders(path: string): string[] {
  const out: string[] = [];
  for (let i = path.indexOf("/"); i > 0; i = path.indexOf("/", i + 1)) out.push(path.slice(0, i));
  return out;
}
