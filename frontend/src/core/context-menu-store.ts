// One right-click menu at a time. `openContextMenu` is called from onContextMenu handlers; <ContextMenu /> renders it.
import { create } from "zustand";

export interface MenuItem { label: string; hint?: string; danger?: boolean; run: () => void }
export interface OpenMenu { x: number; y: number; items: MenuItem[] }

export const useContextMenu = create<{ menu: OpenMenu | null }>(() => ({ menu: null }));

export function openContextMenu(e: { clientX: number; clientY: number; preventDefault(): void; stopPropagation(): void }, items: MenuItem[]): void {
  e.preventDefault();
  e.stopPropagation();
  useContextMenu.setState({ menu: { x: e.clientX, y: e.clientY, items } });
}

export const closeContextMenu = (): void => useContextMenu.setState({ menu: null });
