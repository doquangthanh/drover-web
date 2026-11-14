// Command palette data + filter (pure). Theme/icon-set entries are passed in so this file has no browser dependencies.
export type PaletteCommand = [group: string, label: string, id: string, keys: string, icon: string];

export const BASE_COMMANDS: PaletteCommand[] = [
  ["Create", "New agent…", "newAgent", "Ctrl B c", "plus"],
  ["Create", "New agent in a fresh worktree…", "newAgentWorktree", "Ctrl B C", "branch"],
  ["Create", "New tab", "newTab", "Ctrl B t", "tab"],
  ["Create", "New space from folder…", "newSpace", "Ctrl B S", "folder"],
  ["Create", "New space on machine…", "newSpaceOn", "", "server"],
  ["Agents", "Jump to next agent that needs you", "nextBlocked", "Ctrl B n", "dot"],
  ["Agents", "Jump to next finished agent", "nextDone", "Ctrl B N", "inbox"],
  ["Agents", "Send prompt to selected agents…", "broadcast", "Ctrl B B", "send"],
  ["Agents", "Restart agent and resume session", "restart", "Ctrl B r", "restart"],
  ["Agents", "Send Esc to agent", "sendEsc", "Ctrl B e", "close"],
  ["Agents", "Rename pane", "rename", "Ctrl B ,", "keyboard"],
  ["Agents", "Agent tree", "tree", "Ctrl B o", "tree"],
  ["Layout", "Split right", "splitRight", "Ctrl B %", "split"],
  ["Layout", "Split down", "splitDown", 'Ctrl B "', "splitdown"],
  ["Layout", "Zoom pane", "zoom", "Ctrl B z", "zoom"],
  ["Layout", "Find in scrollback", "find", "Ctrl B [", "search"],
  ["Layout", "Close pane", "closePane", "Ctrl B x", "close"],
  ["Layout", "Close current space…", "closeSpace", "", "close"],
  ["Layout", "Toggle sidebar", "toggleSidebar", "Ctrl B b", "sidebar"],
  ["Go to", "Jump to a terminal", "search", "Ctrl B /", "search"],
  ["Go to", "Inbox", "inbox", "Ctrl B i", "inbox"],
  ["Go to", "Files: tree, code and changed files", "files", "Ctrl B f", "folder"],
  ["Go to", "Changes and worktrees", "changes", "Ctrl B w", "branch"],
  ["Go to", "Machines", "machines", "Ctrl B m", "server"],
  ["Go to", "Settings", "settings", "Ctrl B .", "gear"],
  ["Go to", "herd-server", "server", "Ctrl B D", "server"],
  ["Go to", "Keyboard shortcuts", "help", "Ctrl B ?", "keyboard"],
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

/** "Ctrl B c" -> ["Ctrl B", "c"] for the two key chips; no shortcut -> []. */
export function splitKeys(keys: string): string[] { return keys ? [keys.slice(0, 6), keys.slice(7)] : []; }
