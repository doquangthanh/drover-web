// Changes view: the review diff of one file. Hover a line and press + to comment; each hunk can be marked reviewed or
// rejected. Diff text is only ever rendered as React text nodes (never innerHTML).
import { useEffect, useState } from "react";
import { errorToast, toast } from "../core/toast-store";
import { confirmBox, promptText } from "../overlays/modal-dialogs";
import { FileDiffContent } from "./file-diff-content";
import {
  commentKey, commentsByLine, lineTarget, noReviewSupport, unplacedComments,
  type ReviewComment, type ReviewDiffData, type ReviewHunk, type Side,
} from "./review-logic";
import type { Rpc } from "./use-changes-data";

interface Loaded { key: string; diff?: ReviewDiffData; comments?: ReviewComment[]; error?: unknown }
type Draft = { side: Side; line: number } | null;
type Act = (p: Promise<unknown>) => Promise<void>;

export function ReviewDiff({ rpc, path, base, file, tick, bump }: { rpc: Rpc; path: string; base: string; file: string; tick: number; bump: () => void }) {
  const key = `${path}|${base}|${file}`;
  const [res, setRes] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState<Draft>(null);
  const [cur, setCur] = useState(0); // hunk the keyboard works on

  useEffect(() => {
    let dead = false;
    Promise.all([
      rpc<ReviewDiffData>("review.diff", { cwd: path, base, file }),
      rpc<{ comments: ReviewComment[] }>("review.list", { cwd: path, file }),
    ]).then(([diff, list]) => { if (!dead) setRes({ key, diff, comments: list.comments }); },
      (error) => { if (!dead) setRes({ key, error }); });
    return () => { dead = true; };
  }, [rpc, path, base, file, key, tick]);

  useEffect(() => setDraft(null), [key]);
  useEffect(() => setCur(0), [key]);

  // Keyboard: F7 / Shift+F7 move between hunks, A marks the current hunk reviewed and moves on.
  const hunks = res?.key === key ? res.diff?.hunks : undefined;
  useEffect(() => {
    if (!hunks?.length) return;
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const go = (to: number) => {
        const i = Math.max(0, Math.min(hunks.length - 1, to));
        setCur(i);
        document.querySelector(`[data-hunk="${i}"]`)?.scrollIntoView({ block: "nearest" });
      };
      if (ev.key === "F7") { ev.preventDefault(); go(cur + (ev.shiftKey ? -1 : 1)); }
      else if ((ev.key === "a" || ev.key === "A") && !ev.shiftKey) {
        ev.preventDefault();
        const h = hunks[Math.min(cur, hunks.length - 1)];
        if (!h.reviewed) rpc("review.hunk.accept", { cwd: path, base, file, index: h.index, accepted: true }).then(bump).catch(errorToast);
        go(cur + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hunks, cur, rpc, path, base, file, bump]);

  if (res?.key !== key) return null;
  if (res.error !== undefined) {
    // An older daemon has no review.* methods: keep the plain diff.
    if (noReviewSupport(res.error)) return <FileDiffContent rpc={rpc} path={path} base={base} file={file} />;
    return <div className="errtext" style={{ padding: 14 }}>{(res.error as Error).message}</div>;
  }
  const { diff, comments = [] } = res;
  if (!diff) return null;
  if (diff.binary) return <div className="meta" style={{ padding: 14 }}>Binary file: nothing to review line by line.</div>;
  if (!diff.hunks.length) return <div className="meta" style={{ padding: 14 }}>No changes in this file.</div>;

  const act: Act = (p) => p.then(bump).catch(errorToast);
  const byLine = commentsByLine(comments);
  const loose = unplacedComments(comments, diff.hunks);

  const addComment = (side: Side, line: number, text: string) =>
    act(rpc("review.comment.add", { cwd: path, base, file, side, line, text }).then(() => setDraft(null)));

  return (
    <div className="rv">
      {loose.length ? (
        <div className="rvloose">
          <div className="meta">Comments whose line is no longer in this diff</div>
          {loose.map((c) => <CommentCard key={c.id} c={c} rpc={rpc} path={path} act={act} showLine />)}
        </div>
      ) : null}
      {diff.hunks.map((h, n) => (
        <Hunk key={h.index} h={h} n={n} cur={n === cur} rpc={rpc} path={path} base={base} file={file} act={act}
          byLine={byLine} draft={draft} setDraft={setDraft} addComment={addComment} />
      ))}
    </div>
  );
}

interface HunkProps {
  h: ReviewHunk; n: number; cur: boolean; rpc: Rpc; path: string; base: string; file: string; act: Act;
  byLine: Map<string, ReviewComment[]>; draft: Draft; setDraft: (d: Draft) => void;
  addComment: (side: Side, line: number, text: string) => Promise<void>;
}

function Hunk({ h, n, cur, rpc, path, base, file, act, byLine, draft, setDraft, addComment }: HunkProps) {
  const reject = async () => {
    const ok = await confirmBox("Reject this hunk?", "Its lines go back to the base version in your working tree. A recovery point is saved first.", "Reject", true);
    if (!ok) return;
    await act(rpc<{ undo_ref: string | null }>("review.hunk.reject", { cwd: path, base, file, index: h.index }).then((r) => {
      if (r.undo_ref) toast("Hunk rejected", `Get it back: git checkout ${r.undo_ref} -- ${file}`);
    }));
  };
  return (
    <div className={"rvh" + (h.reviewed ? " done" : "") + (cur ? " cur" : "")} data-hunk={n}>
      <div className="rvhh">
        <span className="mono dim trunc">{h.header}</span>
        <span className="grow" />
        <button className={"btn" + (h.reviewed ? " pri" : "")} onClick={() => act(rpc("review.hunk.accept", { cwd: path, base, file, index: h.index, accepted: !h.reviewed }))}>
          {h.reviewed ? "✓ Reviewed" : "Mark reviewed"}
        </button>
        <button className="btn" onClick={reject}>Reject hunk</button>
      </div>
      {h.lines.map((l, i) => {
        const t = lineTarget(l);
        const here = t ? byLine.get(commentKey(t.side, t.line)) ?? [] : [];
        const drafting = t !== null && draft?.side === t.side && draft.line === t.line;
        return (
          <div key={i}>
            <div className={"rvr " + (l.k === "+" ? "a" : l.k === "-" ? "r" : "")}>
              <span className="ln">{l.o ?? ""}</span>
              <span className="ln">{l.n ?? ""}</span>
              {t ? <button className="rvplus" title="Comment on this line" aria-label="Comment on this line" onClick={() => setDraft(t)}>+</button> : <span />}
              <span className="rvt">{l.k + l.t}</span>
            </div>
            {here.map((c) => <CommentCard key={c.id} c={c} rpc={rpc} path={path} act={act} />)}
            {drafting && t ? <DraftBox onSubmit={(text) => addComment(t.side, t.line, text)} onCancel={() => setDraft(null)} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function DraftBox({ onSubmit, onCancel }: { onSubmit: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  const submit = () => { if (text.trim()) onSubmit(text.trim()); };
  return (
    <div className="rvc draft">
      <textarea autoFocus className="in" rows={3} value={text} placeholder="Comment for the agent…" aria-label="Review comment"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } else if (e.key === "Escape") onCancel(); }} />
      <div className="rvcb"><span className="meta">Ctrl+Enter to add</span><span className="grow" />
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn pri" disabled={!text.trim()} onClick={submit}>Comment</button></div>
    </div>
  );
}

function CommentCard({ c, rpc, path, act, showLine = false }: { c: ReviewComment; rpc: Rpc; path: string; act: Act; showLine?: boolean }) {
  const tone = c.status === "open" ? "info" : c.status === "sent" ? "ok" : c.status === "outdated" ? "bad" : "";
  const call = (method: string, extra: Record<string, unknown> = {}) => act(rpc(method, { cwd: path, id: c.id, ...extra }));
  const edit = async () => { const text = await promptText("Edit comment", c.text, "Comment"); if (text?.trim()) await call("review.comment.edit", { text }); };
  return (
    <div className={"rvc" + (c.status === "resolved" ? " resolved" : "")}>
      <div className="rvcb">
        <span className={`pill ${tone}`}>{c.status}</span>
        {showLine ? <span className="meta mono">{`${c.side === "old" ? "old " : ""}line ${c.line}`}</span> : null}
        <span className="grow" />
        {c.status === "resolved" ? <button className="btn" onClick={() => call("review.comment.resolve", { resolved: false })}>Reopen</button>
          : <button className="btn" onClick={() => call("review.comment.resolve")}>Resolve</button>}
        <button className="btn" onClick={edit}>Edit</button>
        <button className="btn" onClick={() => call("review.comment.delete")}>Delete</button>
      </div>
      <div className="rvtext">{c.text}</div>
      {c.status === "outdated" && c.anchor.trim() ? <div className="meta mono trunc" title={c.anchor}>was: {c.anchor.trim()}</div> : null}
    </div>
  );
}
