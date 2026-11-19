// Command palette data + filter (pure). Theme/icon-set entries are passed in so this file has no browser dependencies.
export type PaletteCommand = [group: string, label: string, id: string, keys: string, icon: string];

export const BASE_COMMANDS: PaletteCommand[] = [
  ["Create", "New terminal", "newAgent", "Ctrl+Shift+`", "plus"],
  ["Create", "New agent in a fresh worktree…", "newAgentWorktree", "", "branch"],
  ["Create", "New tab", "newTab", "Ctrl+N", "tab"],
  ["Create", "New space", "newSpace", "", "folder"],
  ["Create", "New space on machine…", "newSpaceOn", "", "server"],
  ["Agents", "Jump to next agent that needs you", "nextBlocked", "F8", "dot"],
  ["Agents", "Jump to next finished agent", "nextDone", "Shift+F8", "inbox"],
  ["Agents", "Send prompt to selected agents…", "broadcast", "", "send"],
  ["Agents", "Restart agent and resume session", "restart", "", "restart"],
  ["Agents", "Send Esc to agent", "sendEsc", "", "close"],
  ["Agents", "Rename pane", "rename", "F2", "keyboard"],
  ["Agents", "Agent tree", "tree", "Ctrl+Shift+A", "tree"],
  ["Layout", "Split right", "splitRight", "Ctrl+\\", "split"],
  ["Layout", "Split down", "splitDown", "Ctrl+K Ctrl+\\", "splitdown"],
  ["Layout", "Zoom pane", "zoom", "Ctrl+K Ctrl+M", "zoom"],
  ["Layout", "Find in scrollback", "find", "Ctrl+F", "search"],
  ["Layout", "Close pane", "closePane", "Ctrl+K W", "close"],
  ["Layout", "Close current space…", "closeSpace", "", "close"],
  ["Layout", "Toggle sidebar", "toggleSidebar", "Ctrl+B", "sidebar"],
  ["Go to", "Jump to a terminal", "search", "Ctrl+P", "search"],
  ["Go to", "Inbox", "inbox", "Ctrl+Shift+I", "inbox"],
  ["Go to", "Files: tree, code and changed files", "files", "Ctrl+Shift+E", "folder"],
  ["Go to", "Changes and worktrees", "changes", "Ctrl+Shift+G", "branch"],
  ["Go to", "Machines", "machines", "Ctrl+Shift+M", "server"],
  ["Go to", "Settings", "settings", "Ctrl+,", "gear"],
  ["Go to", "drover-server", "server", "", "server"],
  ["Go to", "Keyboard shortcuts", "help", "Ctrl+K Ctrl+S", "keyboard"],
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

/** "Ctrl+K Ctrl+S" -> ["Ctrl+K", "Ctrl+S"]: one chip per step; no shortcut -> []. */
export function splitKeys(keys: string): string[] { return keys ? keys.split(" ") : []; }
