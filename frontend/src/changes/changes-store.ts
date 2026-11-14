// Changes view selection state; survives leaving the view (as the vanilla module state did).
import { create } from "zustand";

export interface ChangesUi {
  path: string | null;       // selected worktree
  file: string | null;
  base: string;              // compare against
  confirm: boolean;          // remove-worktree confirmation open
  stage: "list" | "diff";    // phone only
  wtOpen: boolean;           // phone worktree picker expanded
  wrap: boolean;             // phone diff line wrap
}

export const useChangesUi = create<ChangesUi>(() => ({ path: null, file: null, base: "", confirm: false, stage: "list", wtOpen: false, wrap: true }));

export const patchChangesUi = (p: Partial<ChangesUi>) => useChangesUi.setState(p);
