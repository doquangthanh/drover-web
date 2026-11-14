// Everything the desktop and phone layouts need, assembled once by changes-view.
import type { Space } from "../core/protocol-types";
import type { ChangesUi } from "./changes-store";
import type { ChangedFile, Rpc, Worktree } from "./use-changes-data";
import type { WorktreeActions } from "./use-worktree-actions";

export interface ChangesCtx {
  space: Space; machine: string | null; rpc: Rpc;
  trees: Worktree[]; mainTree: Worktree | undefined; current: Worktree | undefined;
  files: ChangedFile[]; path: string; base: string; ui: ChangesUi; actions: WorktreeActions;
}
