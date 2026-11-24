// Git marks for the editor's gutter, read from a unified diff of the file against HEAD (pure, unit-tested).
export interface DiffMarks {
  /** 1-based line numbers of the NEW file */
  added: number[];
  modified: number[];
  /** line before which something was removed (a red tick) */
  deleted: number[];
}

export function diffMarks(diff: string | null | undefined): DiffMarks {
  const out: DiffMarks = { added: [], modified: [], deleted: [] };
  if (!diff) return out;
  let n = 0, inHunk = false, removed = 0;
  const flush = () => { if (removed) { out.deleted.push(Math.max(1, n)); removed = 0; } };
  for (const line of diff.split("\n")) {
    const h = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (h) { flush(); n = Number(h[1]); inHunk = true; continue; }
    if (!inHunk) continue;
    if (line.startsWith("\\")) continue;       // "\ No newline at end of file"
    if (line.startsWith("-")) { removed++; continue; }
    if (line.startsWith("+")) {
      // an added line right after removed ones replaces them: it is a modification
      if (removed) { out.modified.push(n); removed--; } else out.added.push(n);
      n++;
      continue;
    }
    flush();
    n++;
  }
  flush();
  return out;
}
