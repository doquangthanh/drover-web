// Pure helpers for the chat screen: transcript updates, tool summaries, diffs, durations.
import type { ChatItem, PermissionItem, ToolItem } from "./chat-types";

/** Insert or replace by id, keeping the position of an existing item. Returns a new array. */
export function upsertItem(list: ChatItem[], item: ChatItem): ChatItem[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i < 0) return [...list, item];
  const next = list.slice();
  next[i] = item;
  return next;
}

/** Append streamed text to a text/thinking item. Unknown ids are ignored (the item arrives with its own text). */
export function appendDelta(list: ChatItem[], id: string, text: string): ChatItem[] {
  const i = list.findIndex((x) => x.id === id);
  const item = list[i];
  if (!item || (item.kind !== "text" && item.kind !== "thinking")) return list;
  const next = list.slice();
  next[i] = { ...item, text: item.text + text };
  return next;
}

/** History from the server underneath, anything that arrived live meanwhile on top. */
export function mergeHistory(history: ChatItem[], live: ChatItem[]): ChatItem[] {
  return live.reduce(upsertItem, history);
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const base = (p: string): string => p.split(/[\\/]/).filter(Boolean).slice(-1)[0] || p;

/** One line saying what a tool call does ("Read pricing.tsx", "Run npm test"). */
export function toolSummary(name: string, input: Record<string, unknown>): string {
  const path = str(input.file_path) || str(input.path) || str(input.notebook_path);
  switch (name) {
    case "Read": case "Write": case "Edit": case "MultiEdit": case "NotebookEdit": return path ? base(path) : "";
    case "Bash": return str(input.command).split("\n")[0].slice(0, 120);
    case "Grep": case "Glob": return str(input.pattern);
    case "WebFetch": return str(input.url);
    case "WebSearch": return str(input.query);
    case "Task": case "Agent": return str(input.description);
    default: return path || str(input.description) || "";
  }
}

export interface DiffLine { sign: "+" | "-" | " "; text: string }

const lines = (s: string): string[] => (s === "" ? [] : s.replace(/\r\n/g, "\n").split("\n"));

/** Edit / MultiEdit / Write input as removed + added lines (not a true diff: the agent gives old and new text). */
export function editDiff(name: string, input: Record<string, unknown>): DiffLine[] | null {
  if (name === "Edit") return [...lines(str(input.old_string)).map((text) => ({ sign: "-" as const, text })), ...lines(str(input.new_string)).map((text) => ({ sign: "+" as const, text }))];
  if (name === "MultiEdit" && Array.isArray(input.edits)) {
    return (input.edits as Record<string, unknown>[]).flatMap((e) => editDiff("Edit", e) ?? []);
  }
  if (name === "Write") return lines(str(input.content)).map((text) => ({ sign: "+" as const, text }));
  return null;
}

export const diffCounts = (d: DiffLine[]): { added: number; removed: number } =>
  ({ added: d.filter((l) => l.sign === "+").length, removed: d.filter((l) => l.sign === "-").length });

/** "Run: npm test" style question for a permission card. */
export function permissionQuestion(p: PermissionItem | ToolItem): string {
  const name = "tool" in p ? p.tool : p.name;
  const what = toolSummary(name, p.input);
  if (name === "Bash") return `Run this command?`;
  if (name === "Edit" || name === "Write" || name === "MultiEdit") return `Change ${what || "a file"}?`;
  return `Allow ${name}${what ? ` (${what})` : ""}?`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  return s < 60 ? `${s.toFixed(s < 10 ? 1 : 0)} s` : `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`;
}

