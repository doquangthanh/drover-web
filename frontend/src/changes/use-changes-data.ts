// Changes view data: git info + worktrees of the space's repo, and the files changed in the selected worktree vs base.
import { useCallback, useEffect, useMemo, useState } from "react";
import { conn } from "../core/connection";
import type { Space } from "../core/protocol-types";
import { machineAlias } from "../core/store-derive";
import { useChangesUi } from "./changes-store";

export interface Worktree { path: string; branch?: string; changes?: number; missing?: boolean }
export interface ChangedFile { path: string; status?: string; added?: number; removed?: number }
export interface GitInfo { is_repo: boolean; root: string }
interface Repo { info: GitInfo; trees: Worktree[] }

export type Rpc = <T = unknown>(method: string, params: Record<string, unknown>) => Promise<T>;

export function useChangesData(space: Space) {
  const machine = machineAlias(space);
  const cwd = space.cwd || "";
  const ui = useChangesUi();
  const [tick, setTick] = useState(0);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{ key: string; list: ChangedFile[] } | null>(null);

  const rpc: Rpc = useCallback((method, params) => conn.rpc(method, machine ? { ...params, machine } : params), [machine]);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        // Both in parallel: `git worktree list` works from any folder inside the repo.
        const listing = rpc<Worktree[]>("worktree.list", { repo: cwd });
        listing.catch(() => {}); // a non-repo rejects here; git.info reports that case below
        const info = await rpc<GitInfo>("git.info", { path: cwd });
        if (!info.is_repo) { if (!dead) { setRepo({ info, trees: [] }); setError(null); } return; }
        const trees = await listing;
        if (!dead) { setRepo({ info, trees }); setError(null); }
      } catch (e) { if (!dead) setError((e as Error).message); }
    })();
    return () => { dead = true; };
  }, [rpc, cwd, tick]);

  const trees = repo?.trees;
  const base = ui.base || trees?.[0]?.branch || "main";
  const live = useMemo(() => (trees || []).filter((t) => !t.missing), [trees]); // worktrees whose folder was deleted cannot be opened
  const path = useMemo(() => {
    if (!trees?.length) return null;
    return ui.path && live.some((t) => t.path === ui.path) ? ui.path : (live[1] || live[0] || trees[0]).path;
  }, [trees, live, ui.path]);

  useEffect(() => {
    if (!path) return;
    let dead = false;
    rpc<ChangedFile[]>("worktree.changes", { path, base }).catch(() => [] as ChangedFile[]).then((list) => { if (!dead) setLoaded({ key: `${path}|${base}`, list }); });
    return () => { dead = true; };
  }, [rpc, path, base, tick]);

  const files = loaded?.key === `${path}|${base}` ? loaded.list : null; // never show another worktree's files

  return { rpc, machine, reload, repo, error, files, trees: trees || [], mainTree: trees?.[0], path, base, ui };
}
