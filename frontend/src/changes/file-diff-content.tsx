// Fetches and shows the diff of one changed file (nothing until it arrives; errors as text).
import { useEffect, useState } from "react";
import { DiffView } from "./diff-view";
import type { Rpc } from "./use-changes-data";

interface Result { key: string; diff?: string; error?: string }

export function FileDiffContent({ rpc, path, base, file, errorPad = 0 }: { rpc: Rpc; path: string; base: string; file: string; errorPad?: number }) {
  const key = `${path}|${base}|${file}`;
  const [res, setRes] = useState<Result | null>(null);
  useEffect(() => {
    let dead = false;
    rpc<{ diff: string }>("worktree.diff", { path, base, file })
      .then((r) => { if (!dead) setRes({ key, diff: r.diff }); })
      .catch((e: Error) => { if (!dead) setRes({ key, error: e.message }); });
    return () => { dead = true; };
  }, [rpc, path, base, file, key]);
  if (res?.key !== key) return null;
  return res.error !== undefined ? <div className="errtext" style={{ padding: errorPad }}>{res.error}</div> : <DiffView text={res.diff} />;
}
