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
  ["Go to", "Show / hide the agent beside the editor", "toggleDock", "Ctrl+J", "layers"],
  ["Go to", "Machines", "machines", "Ctrl+Shift+M", "server"],
  ["Go to", "Settings", "settings", "Ctrl+,", "gear"],
  ["Go to", "drover-server", "server", "", "server"],
  ["Go to", "Keyboard shortcuts", "help", "Ctrl+K Ctrl+S", "keyboard"],
  ["Go to", "Check errors: jump to file and line", "quickfix", "", "close"],
  ["System", "Send a test notification", "testNotify", "", "inbox"],
];

export function buildCommands(themes: [string, string][], iconSets: [string, string, ...string[]][]): PaletteCommand[] {
  return [
    ...BASE_COMMANDS,
    ...themes.map(([id, label]): PaletteCommand => ["Theme", `Theme: ${label}`, `theme:${id}`, "", "gear"]),
    ...iconSets.map(([id, label]): PaletteCommand => ["Theme", `File icons: ${label}`, `icons:${id}`, "", "folder"]),
  ];
}

export interface PaletteHit { cmd: PaletteCommand; /** indexes of the label's letters that matched (for highlighting) */ marks: number[] }

/** Indexes of `q` as a subsequence of `text` (case-insensitive), or null. */
function subsequence(text: string, q: string): number[] | null {
  const t = text.toLowerCase(), marks: number[] = [];
  let from = 0;
  for (const ch of q) {
    const i = t.indexOf(ch, from);
    if (i < 0) return null;
    marks.push(i);
    from = i + 1;
  }
  return marks;
}

const range = (start: number, len: number): number[] => Array.from({ length: len }, (_, i) => start + i);

/** Matches for a query, best first. Substring hits come first (label start, then word start, then inside the label,
 * then group name only); if there are none, letters-in-order ("nbl" -> "Jump to next agent that needs you…") as a fallback.
 * Empty query keeps everything in the original order. */
export function searchCommands(commands: PaletteCommand[], query: string): PaletteHit[] {
  const q = query.toLowerCase().trim();
  if (!q) return commands.map((cmd) => ({ cmd, marks: [] }));
  const scored: { hit: PaletteHit; rank: number }[] = [];
  for (const cmd of commands) {
    const label = cmd[1].toLowerCase(), at = label.indexOf(q);
    if (at >= 0) {
      const wordStart = at === 0 || /[\s:/(-]/.test(label[at - 1]);
      scored.push({ hit: { cmd, marks: range(at, q.length) }, rank: at === 0 ? 0 : wordStart ? 1 : 2 });
    } else if (cmd[0].toLowerCase().includes(q)) scored.push({ hit: { cmd, marks: [] }, rank: 3 });
  }
  if (scored.length) return scored.sort((a, b) => a.rank - b.rank).map((s) => s.hit); // stable: ties keep list order
  if (q.length < 2) return [];
  return commands.flatMap((cmd) => { const marks = subsequence(cmd[1], q.replace(/\s+/g, "")); return marks ? [{ cmd, marks }] : []; });
}

/** Substring match on label or group, case-insensitive; empty query keeps everything. */
export function filterCommands(commands: PaletteCommand[], query: string): PaletteCommand[] {
  return searchCommands(commands, query).map((h) => h.cmd);
}

/** Command ids worth offering first on each screen (only ids that exist as actions). */
const SUGGESTED: Record<string, string[]> = {
  workspace: ["newAgent", "splitRight", "find", "nextBlocked", "files"],
  files: ["changes", "search", "nextBlocked", "help"],
  changes: ["files", "nextBlocked", "nextDone", "help"],
  inbox: ["nextBlocked", "files", "changes"],
};

/** The "Suggested" block shown above everything while the query is empty. */
export function suggestedCommands(commands: PaletteCommand[], view: string): PaletteCommand[] {
  return (SUGGESTED[view] ?? []).flatMap((id) => { const c = commands.find((x) => x[2] === id); return c ? [["Suggested", c[1], c[2], c[3], c[4]] as PaletteCommand] : []; });
}

/** "Ctrl+K Ctrl+S" -> ["Ctrl+K", "Ctrl+S"]: one chip per step; no shortcut -> []. */
export function splitKeys(keys: string): string[] { return keys ? keys.split(" ") : []; }
