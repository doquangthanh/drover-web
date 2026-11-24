// Ctrl+Click on a file path in a terminal: open that file (at its line) in the Files view of the pane's space.
import type { Space } from "../core/protocol-types";
import { useStore } from "../core/store";
import { toast } from "../core/toast-store";
import { requestGoto } from "./ace-editor-registry";
import { expandFolders, parentFolders, patchFileUi } from "./files-store";
import { toSpacePath, type PathRef } from "./path-refs";
import { docKey } from "./use-files-data";

export function openPathFromTerminal(paneId: string, ref: PathRef): void {
  const s = useStore.getState();
  const pane = s.paneById.get(paneId);
  const space = pane?.space_id ? s.spaceById.get(pane.space_id) : undefined;
  if (!pane || !space) return;
  const rel = toSpacePath(ref.path, pane.cwd, space.cwd);
  if (!rel) { toast("Outside this space", ref.path); return; }
  openFileAt(space, rel, ref.line, ref.col);
}

/** Show `rel` (a path inside the space) in the Files view, with the cursor on `line` when given. */
export function openFileAt(space: Space, rel: string, line?: number, col?: number): void {
  expandFolders(space.id, parentFolders(rel));
  patchFileUi(space.id, { file: rel, tab: "file", stage: "file", only: false });
  if (line) requestGoto(docKey(space, rel), line, col);
  useStore.getState().setUi({ view: "files", spaceId: space.id, mobilePane: null });
}
