// Review loop (comments on diff lines, hunks reviewed / rejected): wire shapes and the pure helpers around them.
export type Side = "old" | "new";

export interface ReviewLine { k: " " | "+" | "-"; o: number | null; n: number | null; t: string }
export interface ReviewHunk { index: number; header: string; hash: string; reviewed: boolean; lines: ReviewLine[] }
export interface ReviewDiffData { file: string; merge_base: string; binary: boolean; hunks: ReviewHunk[] }
export interface ReviewComment {
  id: string; file: string; side: Side; line: number; anchor: string; text: string;
  /** open | sent | resolved | outdated */
  status: string; created_at: number; sent_at: number | null;
}
export interface ReviewFileSummary { path: string; hunks: number; reviewed: number; open: number; binary?: boolean }
export interface ReviewSummary { files: ReviewFileSummary[]; hunks: number; reviewed: number; open_comments: number }

/** Where a comment on this diff line goes: removed lines belong to the old file, the rest to the working tree. */
export function lineTarget(l: ReviewLine): { side: Side; line: number } | null {
  if (l.k === "-") return l.o == null ? null : { side: "old", line: l.o };
  return l.n == null ? null : { side: "new", line: l.n };
}

export const commentKey = (side: Side, line: number) => `${side}:${line}`;

/** Comments grouped by the diff line they sit on. Resolved ones stay (greyed): they are part of the conversation. */
export function commentsByLine(comments: ReviewComment[]): Map<string, ReviewComment[]> {
  const out = new Map<string, ReviewComment[]>();
  for (const c of comments) {
    if (c.status === "outdated") continue; // its line moved or changed: listed separately
    const key = commentKey(c.side, c.line);
    out.set(key, [...(out.get(key) ?? []), c]);
  }
  return out;
}

/** Comments with no visible line: outdated ones, and ones whose line is outside every hunk now. */
export function unplacedComments(comments: ReviewComment[], hunks: ReviewHunk[]): ReviewComment[] {
  const shown = new Set<string>();
  for (const h of hunks) for (const l of h.lines) { const t = lineTarget(l); if (t) shown.add(commentKey(t.side, t.line)); }
  return comments.filter((c) => c.status === "outdated" || !shown.has(commentKey(c.side, c.line)));
}

export function progressText(s: Pick<ReviewSummary, "hunks" | "reviewed" | "open_comments"> | null): string {
  if (!s) return "";
  const parts = [`${s.reviewed}/${s.hunks} hunks reviewed`];
  if (s.open_comments) parts.push(`${s.open_comments} open comment${s.open_comments === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

export const sendLabel = (open: number) => (open === 1 ? "Send 1 comment to the agent" : `Send ${open} comments to the agent`);

/** The daemon has no review.* methods (the Python fallback daemon). */
export const noReviewSupport = (e: unknown) => /unknown method/i.test((e as Error)?.message ?? "");
