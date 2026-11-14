// View switching, sidebar toggle and the overlay launchers (palette, search, new agent, shortcut list).
import { setUi, ui } from "./action-helpers";
import { hooks } from "./feature-hooks";

/** Switch the main area; leaving the workspace also leaves the phone's full-screen terminal. */
function show(view: string): void {
  setUi({ view, mobilePane: view === "workspace" ? ui().mobilePane : null });
}

export const viewActions = {
  show,
  toggleSidebar: () => setUi({ sidebar: !ui().sidebar }),
  newAgent: (opts: { worktree?: boolean } = {}) => hooks.openNewAgent(opts),
  newAgentWorktree: () => hooks.openNewAgent({ worktree: true }),
  palette: () => hooks.openPalette(),
  search: () => hooks.openSearch(),
  help: () => hooks.openShortcuts(),
  broadcast: () => hooks.openBroadcast(),
  inbox: () => show("inbox"),
  changes: () => show("changes"),
  files: () => show("files"),
  machines: () => show("machines"),
  settings: () => show("settings"),
  server: () => show("server"),
  tree: () => show("tree"),
};
