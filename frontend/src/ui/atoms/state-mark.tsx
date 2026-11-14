import type { Pane } from "../../core/protocol-types";

export function StateMark({ pane }: { pane: Pick<Pane, "state" | "exit_code"> }) {
  switch (pane.state) {
    case "blocked": return <span className="pill blocked">Needs you</span>;
    case "working": return <span className="spin" title="working" />;
    case "done": return <span className="dot done" title="done" />;
    case "exited": return <span className="pill bad">{pane.exit_code ? `exit ${pane.exit_code}` : "exited"}</span>;
    default: return <span className="ring" title={pane.state} />;
  }
}
