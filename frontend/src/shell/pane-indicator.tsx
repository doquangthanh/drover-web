import type { SpaceIndicatorKind } from "./shell-logic";

export function paneIndicator(kind: SpaceIndicatorKind) {
  if (kind === "blocked") return <span className="pill blocked">Needs you</span>;
  if (kind === "working") return <span className="spin" />;
  if (kind === "done") return <span className="dot done" style={{ margin: "0 3px" }} />;
  return null;
}
