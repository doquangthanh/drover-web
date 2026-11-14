// Late-bound entry points owned by later phases (overlays 5, views 6, terminals 8). Until a phase registers its
// implementation, the default tells the user the feature is not in the new UI yet. Actions call through `hooks`.
import { toast } from "../core/toast-store";

export interface FeatureHooks {
  /** phase 5 */ openPalette: () => void;
  /** phase 5 */ openSearch: () => void;
  /** phase 5 */ openNewAgent: (opts: { worktree?: boolean; [k: string]: unknown }) => void;
  /** phase 5 */ chooseFolder: (machine: string | null, start: string) => Promise<string | null>;
  /** phase 5 */ openShortcuts: () => void;
  /** phase 5 */ openBroadcast: () => void;
  /** phase 8 */ focusTerminal: (paneId: string | null) => void;
  /** phase 8 */ copySelection: (paneId: string) => boolean;
}

const notYet = (what: string) => () => { toast(`${what} is not in the new UI yet`, "Use the classic UI at / for now."); };

export const hooks: FeatureHooks = {
  openPalette: notYet("Command palette"),
  openSearch: notYet("Jump to a terminal"),
  openNewAgent: notYet("New agent"),
  chooseFolder: async () => { notYet("Folder picker")(); return null; },
  openShortcuts: notYet("Shortcut list"),
  openBroadcast: notYet("Broadcast"),
  focusTerminal: () => {}, // nothing to focus until terminals exist
  copySelection: () => false,
};

export function setFeatureHooks(patch: Partial<FeatureHooks>): void { Object.assign(hooks, patch); }
