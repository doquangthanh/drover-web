// Which row is being renamed in place ("pane:%3", "space:s1", "tab:t2"). Rows swap their name for an input while it matches.
import { create } from "zustand";

export const useRenaming = create<{ key: string | null }>(() => ({ key: null }));
export const startRename = (key: string): void => useRenaming.setState({ key });
export const stopRename = (): void => useRenaming.setState({ key: null });

/** Rename in place when the row is on screen (selector like `#sidebar`), else the caller falls back to a dialog. */
export function renameInPlace(key: string, scope: string): boolean {
  if (!document.querySelector(`${scope} [data-key="${key}"]`)) return false;
  startRename(key);
  return true;
}
