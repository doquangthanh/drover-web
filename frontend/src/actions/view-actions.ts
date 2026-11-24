// View switching, sidebar toggle and the overlay launchers (palette, search, new agent, shortcut list).
import { getFileUi, patchFileUi } from "../files/files-store";
import { setUi, ui } from "./action-helpers";
import { hooks } from "./feature-hooks";
import { tabSpaceActions } from "./tab-space-actions";

/** Switch the main area; leaving the workspace also leaves the phone's full-screen terminal. */
function show(view: string): void {
  setUi({ view, mobilePane: view === "workspace" ? ui().mobilePane : null });
}

export const viewActions = {
  show,
  toggleSidebar: () => setUi({ sidebar: !ui().sidebar }),
  // Like herdr: no agent picker. A new terminal in the current space (or a new space); run claude/codex/... in it.
  newAgent: (opts: { worktree?: boolean } = {}) => (opts.worktree ? hooks.openNewAgent(opts) : tabSpaceActions.newTab()),
  newAgentWorktree: () => hooks.openNewAgent({ worktree: true }),
  palette: () => hooks.openPalette(),
  search: () => hooks.openSearch(),
  help: () => hooks.openShortcuts(),
  broadcast: () => hooks.openBroadcast(),
  /** Show or hide the agent beside the editor (Files view). */
  toggleDock: () => {
    const id = ui().spaceId;
    if (id && ui().view === "files") patchFileUi(id, { dock: getFileUi(id).dock === false });
  },
  inbox: () => show("inbox"),
  changes: () => show("changes"),
  files: () => show("files"),
  machines: () => show("machines"),
  settings: () => show("settings"),
  server: () => show("server"),
  tree: () => show("tree"),
};
