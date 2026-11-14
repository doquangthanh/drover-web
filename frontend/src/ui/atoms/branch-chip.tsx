import type { Space } from "../../core/protocol-types";
import { Icon } from "./icon";

/** "branch main ●2 ↑1" for a space that is a git repo (branch, uncommitted files, unpushed commits), else nothing. */
export function BranchChip({ space, onClick }: { space?: Space | null; onClick?: () => void }) {
  if (!space || !space.branch) return null;
  const bits = (
    <>
      <Icon name="branch" />
      <span className="gb-name">{space.branch}</span>
      {space.dirty ? <span className="gb-dirty" title={`${space.dirty} uncommitted file${space.dirty > 1 ? "s" : ""}`}>●{space.dirty}</span> : null}
      {space.ahead ? <span className="gb-ahead" title={`${space.ahead} commit${space.ahead > 1 ? "s" : ""} not pushed`}>↑{space.ahead}</span> : null}
    </>
  );
  const title = `Git branch ${space.branch}`;
  return onClick
    ? <button className="gb" title={title} onClick={onClick}>{bits}</button>
    : <span className="gb" title={title}>{bits}</span>;
}
