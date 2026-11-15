// Pure helpers for the New agent dialog.
export type AgentKind = "claude" | "codex" | "gemini" | "opencode" | "shell" | "custom";
/** [kind, label, command]; `custom` takes its command from the user. */
export const AGENTS: [AgentKind, string, string | null][] = [
  ["claude", "Claude Code", "claude"], ["codex", "Codex", "codex"], ["gemini", "Gemini", "gemini"],
  ["opencode", "opencode", "opencode"], ["shell", "Shell", ""], ["custom", "Custom…", null],
];

export type Placement = "tab" | "split" | "background";

/** Full command line: agent (or the custom command) plus extra arguments. */
export function buildCommand(kind: AgentKind, custom: string, args: string): string {
  const base = kind === "custom" ? custom.trim() : AGENTS.find((a) => a[0] === kind)?.[2] ?? "";
  return [base, args.trim()].filter(Boolean).join(" ");
}

/** Worktree/branch slug from the task name (falls back to the agent kind, then "task"). */
export function worktreeSlug(name: string, kind: string): string {
  return (name.trim() || kind).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "task";
}

export function worktreePath(root: string | undefined, slug: string): string {
  const r = (root || "").replace(/[\\/]+$/, "");
  return r ? `${r}-wt/${slug}` : "";
}

/** The `dr run` equivalent shown in the footer. */
export function cliPreview(machine: string | null, worktree: boolean, command: string): string {
  return `dr run${machine ? " --on " + machine : ""}${worktree ? " --worktree <task>" : ""} -- ${command || "(shell)"}`;
}

export type CreateParams = {
  command: string; cwd: string; name: string; machine?: string; worktree?: { task: string };
  tab_id?: string; split_from?: string;
};

export function createParams(o: {
  command: string; cwd: string; name: string; kind: string; machine: string | null; worktree: boolean; place: Placement;
  focused?: { id: string; tab_id?: string; machine?: string } | null; now?: number;
}): CreateParams {
  const params: CreateParams = { command: o.command, cwd: o.cwd.trim(), name: o.name.trim() };
  if (o.machine) params.machine = o.machine;
  if (o.worktree) params.worktree = { task: params.name || `${o.kind}-${(o.now ?? Date.now()) % 10000}` };
  const f = o.focused;
  if (o.place === "split" && f && (f.machine || "local") === (o.machine || "local")) { params.tab_id = f.tab_id; params.split_from = f.id; }
  return params;
}
