// Combined view of local + remote machines plus UI-only selection state. Imperative code uses useStore.getState().
import { create } from "zustand";
import type { Pane, RawState } from "./protocol-types";
import { replaceEqual } from "./structural-share";
import { EMPTY_RAW, derive, fixSelection, machineOf, type Derived } from "./store-derive";

export interface UiState {
  view: string;
  tabId: string | null;
  spaceId: string | null;
  sidebar: boolean;
  prefix: boolean;
  findPane: string | null;
  focusedPane: string | null;
  mobilePane: string | null;
}

export interface StoreState extends Derived {
  raw: RawState;
  ui: UiState;
  connected: boolean;
  setRaw: (raw: RawState) => void;
  upsertPane: (pane: Pane) => void;
  setUi: (patch: Partial<UiState>) => void;
  setConnected: (up: boolean) => void;
}

export const INITIAL_UI: UiState = {
  view: "workspace", tabId: null, spaceId: null, sidebar: true, prefix: false, findPane: null, focusedPane: null, mobilePane: null,
};

function withSelection(raw: RawState, prev: StoreState) {
  const d = derive(raw, prev);
  const sel = fixSelection(d, prev.ui);
  const ui = sel.tabId === prev.ui.tabId && sel.spaceId === prev.ui.spaceId ? prev.ui : { ...prev.ui, ...sel };
  return { ...d, raw, ui };
}

function upsert<T extends { id: string }>(list: T[] | undefined, item: T): T[] | undefined {
  if (!list) return list;
  const i = list.findIndex((x) => x.id === item.id);
  if (i < 0) return [...list, item];
  const out = list.slice();
  out[i] = replaceEqual(list[i], item);
  return out;
}

export const useStore = create<StoreState>((set, get) => ({
  ...derive(EMPTY_RAW),
  raw: EMPTY_RAW,
  ui: INITIAL_UI,
  connected: false,

  setRaw(next) {
    const prev = get();
    const raw = replaceEqual(prev.raw, next);
    if (raw === prev.raw) return;
    set(withSelection(raw, prev));
  },

  upsertPane(pane) {
    const prev = get();
    const machine = machineOf(prev.raw, pane.id);
    let raw: RawState;
    if (machine?.snapshot) {
      const panes = upsert(machine.snapshot.panes, pane);
      if (!panes) return;
      const machines = (prev.raw.machines || []).map((m) => (m === machine ? { ...m, snapshot: { ...m.snapshot, panes } } : m));
      raw = { ...prev.raw, machines };
    } else {
      const panes = upsert(prev.raw.panes, pane);
      if (!panes) return;
      raw = { ...prev.raw, panes };
    }
    set(withSelection(raw, prev));
  },

  setUi(patch) { set({ ui: { ...get().ui, ...patch } }); },
  setConnected(connected) { set({ connected }); },
}));
