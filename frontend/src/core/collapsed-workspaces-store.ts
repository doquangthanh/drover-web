// Which workspaces are collapsed in the sidebar tree. Per device: kept in localStorage, never sent to the daemon.
import { create } from "zustand";

const KEY = "drover.sidebar.collapsed";

function load(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}

function save(ids: Set<string>): void {
  try { localStorage.setItem(KEY, JSON.stringify([...ids])); } catch { /* private mode: this session only */ }
}

interface CollapsedState {
  collapsed: Set<string>;
  toggle: (spaceId: string) => void;
}

export const useCollapsedWorkspaces = create<CollapsedState>((set, get) => ({
  collapsed: new Set(load()),
  toggle(spaceId) {
    const next = new Set(get().collapsed);
    if (next.has(spaceId)) next.delete(spaceId); else next.add(spaceId);
    save(next);
    set({ collapsed: next });
  },
}));
