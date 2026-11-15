// Fetch-on-mount RPC hook for the alt views. Keeps the previous result while reloading (no flash of "Loading").
import { useCallback, useEffect, useRef, useState } from "react";
import { conn } from "../core/connection";

/** `stale`: `data` was fetched with other params (kept on screen while the new call runs). */
export interface RpcResult<T> { data: T | null; error: string | null; loading: boolean; stale: boolean; reload: () => void }

/** Calls `method` when mounted and whenever `deps` change; `reload()` repeats it. Failures show inline via `error`. */
export function useRpc<T = any>(method: string, params: Record<string, unknown> = {}, deps: unknown[] = []): RpcResult<T> {
  type S = { data: T | null; error: string | null; loading: boolean; key: string | null };
  const [state, setState] = useState<S>({ data: null, error: null, loading: true, key: null });
  const [tick, setTick] = useState(0);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const key = method + JSON.stringify(params);

  useEffect(() => {
    let live = true;
    const callKey = method + JSON.stringify(paramsRef.current);
    setState((s) => (s.loading ? s : { ...s, loading: true }));
    conn.rpc<T>(method, paramsRef.current).then(
      (data) => { if (live) setState({ data, error: null, loading: false, key: callKey }); },
      (e: Error) => { if (live) setState((s) => ({ ...s, error: e.message, loading: false })); },
    );
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, tick, ...deps]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  const { key: dataKey, ...rest } = state;
  return { ...rest, stale: dataKey !== null && dataKey !== key, reload };
}
