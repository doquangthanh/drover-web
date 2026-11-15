// Changes: worktrees of the current space's repo, files changed vs base, diff, commit / push / PR.
import { useEffect } from "react";
import { useStore } from "../core/store";
import { useIsPhone } from "../core/viewport";
import { clearTopExtra, setTopExtra } from "../shell/top-extra-store";
import { ChangesDesktop } from "./changes-desktop";
import { ChangesPhone } from "./changes-phone";
import { useChangesData } from "./use-changes-data";
import { useWorktreeActions } from "./use-worktree-actions";
import type { Space } from "../core/protocol-types";

function ChangesBody({ space }: { space: Space }) {
  const phone = useIsPhone();
  const d = useChangesData(space);
  const info = d.repo?.info;
  const current = d.trees.find((t) => t.path === d.path);
  const actions = useWorktreeActions({ rpc: d.rpc, reload: d.reload, info: info ?? { is_repo: false, root: "" }, path: d.path ?? "", base: d.base, current });

  useEffect(() => {
    if (!info?.is_repo) return;
    setTopExtra("changes", { right: <button className="btn" style={{ marginLeft: 6 }} onClick={actions.newWorktree}>+ New task worktree</button> });
    return () => clearTopExtra("changes");
  }, [info?.is_repo, actions.newWorktree]);

  const ctx = d.path && d.files ? { space, machine: d.machine, rpc: d.rpc, trees: d.trees, mainTree: d.mainTree, current,
    files: d.files, path: d.path, base: d.base, ui: d.ui, actions } : null;

  if (d.error) return <div className="view errtext">{d.error}</div>;
  if (!d.repo) return <div className="view meta">Loading git info…</div>;
  if (!info?.is_repo) return <div className="view meta">{`${space.cwd} is not a git repository.`}</div>;
  if (!ctx) return <div className="view meta">Loading git info…</div>;
  return phone ? <ChangesPhone c={ctx} /> : <ChangesDesktop c={ctx} />;
}

export default function ChangesView() {
  const space = useStore((s) => (s.ui.spaceId ? s.spaceById.get(s.ui.spaceId) : undefined));
  if (!space) return <div className="view meta">Open a workspace first.</div>;
  return <ChangesBody key={space.id} space={space} />;
}
