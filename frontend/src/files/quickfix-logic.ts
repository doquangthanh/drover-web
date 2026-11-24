// "Quickfix": the file:line references in the output of failed checks, as a list to jump through (pure, unit-tested).
import { findPathRefs, toSpacePath } from "./path-refs";

export interface QuickfixItem { step: string; path: string; line?: number; col?: number; text: string }
interface StepOutput { name: string; status: string; output: string }

const MAX_ITEMS = 200;

/** One item per distinct file:line:col mentioned by a step that did not pass. Paths outside the space are left out. */
export function quickfixItems(results: StepOutput[], spaceCwd: string): QuickfixItem[] {
  const seen = new Set<string>();
  const out: QuickfixItem[] = [];
  for (const r of results) {
    if (r.status === "passed" || !r.output) continue;
    for (const line of r.output.split(/\r?\n/)) {
      for (const ref of findPathRefs(line)) {
        const path = toSpacePath(ref.path, spaceCwd, spaceCwd);
        if (!path) continue;
        const id = `${path}:${ref.line ?? ""}:${ref.col ?? ""}`;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({ step: r.name, path, line: ref.line, col: ref.col, text: line.trim() });
        if (out.length >= MAX_ITEMS) return out;
      }
    }
  }
  return out;
}
