// Changes view: review progress and the button that sends every open comment back to the agent.
import { useEffect, useState } from "react";
import { errorToast, toast } from "../core/toast-store";
import { promptText } from "../overlays/modal-dialogs";
import { progressText, sendLabel, type ReviewSummary } from "./review-logic";
import type { Rpc } from "./use-changes-data";

export function ReviewBar({ rpc, path, base, tick, bump }: { rpc: Rpc; path: string; base: string; tick: number; bump: () => void }) {
  const [sum, setSum] = useState<ReviewSummary | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let dead = false;
    rpc<ReviewSummary>("review.summary", { cwd: path, base }).then((s) => { if (!dead) setSum(s); }, () => { if (!dead) setSum(null); });
    return () => { dead = true; };
  }, [rpc, path, base, tick]);

  if (!sum || !sum.hunks) return null;
  const open = sum.open_comments;

  const send = async () => {
    setBusy(true);
    try {
      let pane = "";
      for (;;) {
        try {
          const r = await rpc<{ sent: number; pane: string }>("review.send", { cwd: path, pane });
          toast(`Sent ${r.sent} comment${r.sent === 1 ? "" : "s"}`, `to ${r.pane}`);
          break;
        } catch (e) {
          // Several agents in this folder: the daemon asks which one.
          if (!pane && /say which one/i.test((e as Error).message)) {
            const answer = await promptText("Which agent?", "", "Agent name or id");
            if (!answer) return;
            pane = answer;
            continue;
          }
          throw e;
        }
      }
      bump();
    } catch (e) { errorToast(e); } finally { setBusy(false); }
  };

  return (
    <div className="rvbar">
      <span className="meta">Review</span>
      <span>{progressText(sum)}</span>
      <span className="grow" />
      <button className="btn pri" disabled={!open || busy} onClick={send}>{sendLabel(open)}</button>
    </div>
  );
}
