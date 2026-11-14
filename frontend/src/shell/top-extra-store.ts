// Views push extra content into the desktop top bar (`meta` after the title, `right` at the far end).
import type { ReactNode } from "react";
import { create } from "zustand";

interface TopExtra { view: string | null; meta: ReactNode; right: ReactNode }

export const useTopExtra = create<TopExtra>(() => ({ view: null, meta: null, right: null }));

export const setTopExtra = (view: string, parts: { meta?: ReactNode; right?: ReactNode }) =>
  useTopExtra.setState({ view, meta: null, right: null, ...parts });

/** Call from a view's effect cleanup so stale extras never show on another view. */
export const clearTopExtra = (view: string) => {
  if (useTopExtra.getState().view === view) useTopExtra.setState({ view: null, meta: null, right: null });
};
