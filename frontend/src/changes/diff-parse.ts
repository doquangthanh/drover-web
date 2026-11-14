// Unified diff text -> rows with line numbers (new-file numbers; old-file numbers for removed lines).
export interface DiffRow { cls: "h" | "a" | "r" | ""; text: string; n?: string }

const HEADER = /^(diff --git|index |--- |\+\+\+ )/;
const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)/;

/** Empty array when there is nothing to show. */
export function parseDiff(text: string | null | undefined): DiffRow[] {
  const lines = (text || "").split("\n").filter((l) => !HEADER.test(l));
  if (!lines.join("").trim()) return [];
  let oldN = 0, newN = 0;
  return lines.map((l): DiffRow => {
    const hunk = HUNK.exec(l);
    if (hunk) { oldN = +hunk[1]; newN = +hunk[2]; return { cls: "h", text: l }; }
    const cls = l[0] === "+" ? "a" : l[0] === "-" ? "r" : "";
    let n: number;
    if (cls === "r") n = oldN++; else if (cls === "a") n = newN++; else { n = newN++; oldN++; }
    return { cls, text: " " + (l || " "), n: String(n).padStart(3, " ") };
  });
}
