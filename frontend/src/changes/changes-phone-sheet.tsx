// "More actions" bottom sheet of the phone Changes screen.
import { hooks } from "../actions/feature-hooks";
import { closeModal, openModal } from "../overlays/modal-store";
import { patchChangesUi } from "./changes-store";
import type { ChangesCtx } from "./changes-ctx";

export function openChangesSheet(c: ChangesCtx): void {
  const { current, mainTree, base, actions, machine } = c;
  const row = (label: string, fn: () => void, cls = "") => (
    <button key={label} className={"sheet-row " + cls} onClick={() => { closeModal(); setTimeout(fn, 0); }}><span className="grow">{label}</span></button>
  );
  const rows = [
    row("New task worktree", actions.newWorktree),
    row(`Compare against: ${base}`, actions.compareAgainst),
  ];
  if (current && current.branch !== base) rows.unshift(row(`Rebase on ${base}`, () => { void actions.run(`Rebase on ${base}`, actions.rebase); }));
  if (current && current !== mainTree) {
    rows.push(row("Open an agent here", () => hooks.openNewAgent({ cwd: current.path, machine })));
    rows.push(row("Remove this worktree…", () => patchChangesUi({ confirm: true, wtOpen: true }), "danger"));
  }
  openModal({ title: "Actions", size: "sheet", body: <div className="sheet-list">{rows}</div> });
}
