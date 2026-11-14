// Shared helpers for the action modules: RPC with error toast, store lookups, per-machine grouping.
import { conn } from "../core/connection";
import type { Pane, Space, Tab } from "../core/protocol-types";
import { useStore } from "../core/store";
import { errorToast } from "../core/toast-store";

export interface PaneOpts { paneId?: string; query?: string }

export const state = () => useStore.getState();
export const ui = () => useStore.getState().ui;
export const setUi = (patch: Partial<ReturnType<typeof ui>>) => useStore.getState().setUi(patch);

export const pane = (id: string | null | undefined): Pane | undefined => (id ? state().paneById.get(id) : undefined);
export const tab = (id: string | null | undefined): Tab | undefined => (id ? state().tabById.get(id) : undefined);
export const space = (id: string | null | undefined): Space | undefined => (id ? state().spaceById.get(id) : undefined);
export const tabsOf = (spaceId: string | null): Tab[] => state().tabs.filter((t) => t.space_id === spaceId);
export const panesOf = (spaceId: string): Pane[] => state().panes.filter((p) => p.space_id === spaceId);

/** The pane an action targets: explicit (pane header buttons) or the focused one (shortcuts). */
export const focusedId = (opts?: PaneOpts): string | null => opts?.paneId || ui().focusedPane;

/** RPC that toasts failures and rethrows; callers that do not care add `.catch(() => {})`. */
export function rpc<T = any>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  return conn.rpc<T>(method, params).catch((e) => { errorToast(e); throw e; });
}

/** Fire-and-forget variant: failure was already toasted. */
export function rpcQuiet<T = any>(method: string, params: Record<string, unknown> = {}): Promise<T | null> {
  return rpc<T>(method, params).catch(() => null);
}

/** Add `machine` to RPC params for a remote object ("local"/missing means this computer). */
export function withMachine<T extends Record<string, unknown>>(params: T, obj: { machine?: string } | undefined): T {
  return obj?.machine && obj.machine !== "local" ? { ...params, machine: obj.machine } : params;
}

/** Group pane ids by machine: "vps-1:%3" -> vps-1, "%3" -> null (this computer). */
export function byMachine(ids: string[] | undefined): Map<string | null, string[]> {
  const groups = new Map<string | null, string[]>();
  for (const id of ids || []) {
    const machine = String(id).includes(":") ? String(id).split(":")[0] : null;
    if (!groups.has(machine)) groups.set(machine, []);
    groups.get(machine)!.push(id);
  }
  return groups;
}

/** Ids of the panes in a tab layout, in tree order. */
export function layoutPaneIds(t: Tab | undefined): string[] {
  return t ? JSON.stringify(t.layout).match(/"pane":"([^"]+)"/g)?.map((s) => s.slice(8, -1)) || [] : [];
}
