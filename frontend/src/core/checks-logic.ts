// Post-run checks: match a daemon check summary to a pane or folder, and say it in words. Pure, no React.
import type { CheckSummary, Pane } from "./protocol-types";

/** A folder as the daemon keys it: forward slashes, no trailing slash, no `//?/`; Windows drive paths ignore case. */
export function folderKey(path: string): string {
  const p = path.replace(/\\/g, "/").replace(/^\/\/\?\//, "").replace(/\/+$/, "");
  return /^[a-z]:/i.test(p) ? p.toLowerCase() : p;
}

const newest = (list: CheckSummary[]) => list.reduce<CheckSummary | undefined>((a, b) => (!a || b.started_at > a.started_at ? b : a), undefined);

/** The latest run an agent started (matched by pane id), else the latest run in its folder. */
export function checkForPane(checks: Record<string, CheckSummary> | undefined, pane: Pick<Pane, "id" | "cwd">): CheckSummary | undefined {
  if (!checks) return undefined;
  const list = Object.values(checks);
  const byPane = newest(list.filter((c) => c.pane === pane.id));
  if (byPane) return byPane;
  const key = pane.cwd ? folderKey(pane.cwd) : "";
  return key ? newest(list.filter((c) => folderKey(c.cwd) === key)) : undefined;
}

export function checkForFolder(checks: Record<string, CheckSummary> | undefined, cwd: string): CheckSummary | undefined {
  const key = folderKey(cwd);
  return checks ? newest(Object.values(checks).filter((c) => folderKey(c.cwd) === key)) : undefined;
}

export const checkBusy = (c: Pick<CheckSummary, "status">) => c.status === "queued" || c.status === "running";

/** Sidebar badge: nothing for a cancelled run (the agent started a new turn, so the old result is stale). */
export function checkBadge(c: CheckSummary | undefined): { tone: "ok" | "bad" | "info"; text: string; title: string } | null {
  if (!c || c.status === "cancelled") return null;
  if (checkBusy(c)) return { tone: "info", text: "checks…", title: `Checks ${c.status} (${c.passed}/${c.total} done)` };
  const bad = (c.steps ?? []).filter((s) => s.status !== "passed").map((s) => s.name);
  if (c.status === "passed") return { tone: "ok", text: "✓ checks", title: `All ${c.total} checks passed` };
  return { tone: "bad", text: `✗ ${c.failed}/${c.total}`, title: `Checks failed: ${bad.join(", ") || "see Changes"}` };
}
