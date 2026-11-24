import { checkBadge, checkForPane } from "../../core/checks-logic";
import type { Pane } from "../../core/protocol-types";
import { useStore } from "../../core/store";

/** Result of the agent's post-run checks, next to its state. Hidden while the agent works again (the result is stale). */
export function CheckMark({ pane }: { pane: Pick<Pane, "id" | "cwd" | "state"> }) {
  const summary = useStore((s) => checkForPane(s.raw.checks, pane));
  const badge = pane.state === "working" && summary?.status !== "running" ? null : checkBadge(summary);
  return badge ? <span className={`pill ${badge.tone}`} title={badge.title}>{badge.text}</span> : null;
}
