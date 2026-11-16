// Command palette data + filter (pure). Theme/icon-set entries are passed in so this file has no browser dependencies.
export type PaletteCommand = [group: string, label: string, id: string, keys: string, icon: string];

export const BASE_COMMANDS: PaletteCommand[] = [
  ["Create", "New agent…", "newAgent", "Ctrl A c", "plus"],
  ["Create", "New agent in a fresh worktree…", "newAgentWorktree", "Ctrl A C", "branch"],
  ["Create", "New tab", "newTab", "Ctrl A t", "tab"],
  ["Create", "New space", "newSpace", "Ctrl A S", "folder"],
  ["Create", "New space on machine…", "newSpaceOn", "", "server"],
  ["Agents", "Jump to next agent that needs you", "nextBlocked", "Ctrl A n", "dot"],
  ["Agents", "Jump to next finished agent", "nextDone", "Ctrl A N", "inbox"],
  ["Agents", "Send prompt to selected agents…", "broadcast", "Ctrl A B", "send"],
  ["Agents", "Restart agent and resume session", "restart", "Ctrl A r", "restart"],
  ["Agents", "Send Esc to agent", "sendEsc", "Ctrl A e", "close"],
  ["Agents", "Rename pane", "rename", "Ctrl A ,", "keyboard"],
  ["Agents", "Agent tree", "tree", "Ctrl A o", "tree"],
  ["Layout", "Split right", "splitRight", "Ctrl A %", "split"],
  ["Layout", "Split down", "splitDown", 'Ctrl A "', "splitdown"],
  ["Layout", "Zoom pane", "zoom", "Ctrl A z", "zoom"],
  ["Layout", "Find in scrollback", "find", "Ctrl A [", "search"],
  ["Layout", "Close pane", "closePane", "Ctrl A x", "close"],
  ["Layout", "Close current space…", "closeSpace", "", "close"],
  ["Layout", "Toggle sidebar", "toggleSidebar", "Ctrl A b", "sidebar"],
  ["Go to", "Jump to a terminal", "search", "Ctrl A /", "search"],
  ["Go to", "Inbox", "inbox", "Ctrl A i", "inbox"],
  ["Go to", "Files: tree, code and changed files", "files", "Ctrl A f", "folder"],
  ["Go to", "Changes and worktrees", "changes", "Ctrl A w", "branch"],
  ["Go to", "Machines", "machines", "Ctrl A m", "server"],
  ["Go to", "Settings", "settings", "Ctrl A .", "gear"],
  ["Go to", "drover-server", "server", "Ctrl A D", "server"],
  ["Go to", "Keyboard shortcuts", "help", "Ctrl A ?", "keyboard"],
  ["System", "Send a test notification", "testNotify", "", "inbox"],
];

export function buildCommands(themes: [string, string][], iconSets: [string, string, ...string[]][]): PaletteCommand[] {
  return [
    ...BASE_COMMANDS,
    ...themes.map(([id, label]): PaletteCommand => ["Theme", `Theme: ${label}`, `theme:${id}`, "", "gear"]),
    ...iconSets.map(([id, label]): PaletteCommand => ["Theme", `File icons: ${label}`, `icons:${id}`, "", "folder"]),
  ];
}

/** Substring match on label or group, case-insensitive; empty query keeps everything. */
export function filterCommands(commands: PaletteCommand[], query: string): PaletteCommand[] {
  const q = query.toLowerCase().trim();
  return commands.filter((c) => !q || c[1].toLowerCase().includes(q) || c[0].toLowerCase().includes(q));
}

/** "Ctrl A c" -> ["Ctrl A", "c"] for the two key chips; no shortcut -> []. */
export function splitKeys(keys: string): string[] { return keys ? [keys.slice(0, 6), keys.slice(7)] : []; }
