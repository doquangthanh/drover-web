// Git/worktree operations shared by the desktop and phone Changes layouts.
import { useMemo } from "react";
import { errorToast, toast } from "../core/toast-store";
import { promptText } from "../overlays/modal-dialogs";
import { patchChangesUi } from "./changes-store";
import type { GitInfo, Rpc, Worktree } from "./use-changes-data";

interface Output { output?: string }
interface Args { rpc: Rpc; reload: () => void; info: GitInfo; path: string; base: string; current: Worktree | undefined }

export function worktreeActions({ rpc, reload, info, path, base, current }: Args) {
  /** Run an operation, toast its output, refresh the view. */
  const run = async (label: string, fn: () => Promise<Output | null | undefined>) => {
    try { const r = await fn(); if (r?.output) toast(label, r.output.slice(0, 200)); reload(); } catch (e) { errorToast(e); }
  };
  return {
    run,
    commit: async (): Promise<Output | null> => {
      const message = await promptText("Commit message", "", "Message");
      return message ? rpc<Output>("git.commit", { path, message }) : null;
    },
    pushPr: async (): Promise<Output> => { await rpc("git.push", { path }); return rpc<Output>("git.pr", { path }); },
    rebase: () => rpc<Output>("git.rebase", { path, base }),
    newWorktree: async () => {
      const task = await promptText("New task worktree", "", "Task name");
      if (!task) return;
      try {
        const r = await rpc<{ branch: string; path: string }>("worktree.create", { repo: info.root, task, base });
        toast(`Created ${r.branch}`);
        patchChangesUi({ path: r.path });
        reload();
      } catch (e) { errorToast(e); }
    },
    removeCurrent: (force: boolean) => {
      if (!current) return;
      return rpc("worktree.remove", force ? { path: current.path, force } : { path: current.path })
        .then(() => { patchChangesUi({ path: null, confirm: false }); reload(); }).catch(errorToast);
    },
    prune: async (count: number) => {
      try {
        await rpc("worktree.prune", { repo: info.root });
        toast("Cleaned up", `${count} stale worktree${count > 1 ? "s" : ""} removed from git's list`);
        reload();
      } catch (e) { errorToast(e); }
    },
    compareAgainst: async () => {
      const b = await promptText("Compare against", base, "Branch or commit");
      if (b) patchChangesUi({ base: b.trim() });
    },
  };
}

export type WorktreeActions = ReturnType<typeof worktreeActions>;

export function useWorktreeActions(args: Args): WorktreeActions {
  const { rpc, reload, info, path, base, current } = args;
  return useMemo(() => worktreeActions(args), [rpc, reload, info, path, base, current]); // eslint-disable-line react-hooks/exhaustive-deps
}
