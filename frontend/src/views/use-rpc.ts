// Fetch-on-mount RPC hook for the alt views. Keeps the previous result while reloading (no flash of "Loading").
import { useCallback, useEffect, useRef, useState } from "react";
import { conn } from "../core/connection";

export interface RpcResult<T> { data: T | null; error: string | null; loading: boolean; reload: () => void }

/** Calls `method` when mounted and whenever `deps` change; `reload()` repeats it. Failures show inline via `error`. */
export function useRpc<T = any>(method: string, params: Record<string, unknown> = {}, deps: unknown[] = []): RpcResult<T> {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    let live = true;
    setState((s) => (s.loading ? s : { ...s, loading: true }));
    conn.rpc<T>(method, paramsRef.current).then(
      (data) => { if (live) setState({ data, error: null, loading: false }); },
      (e: Error) => { if (live) setState((s) => ({ data: s.data, error: e.message, loading: false })); },
    );
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, tick, ...deps]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { ...state, reload };
}
