// One active modal at a time (same as the vanilla modal.js). Opening a modal replaces the current one without calling its onClose.
import type { ReactNode } from "react";
import { create } from "zustand";

export interface ModalSpec {
  title?: string;
  /** Replaces the default `.mhead` with the title. */
  head?: ReactNode;
  body?: ReactNode;
  foot?: ReactNode;
  size?: string;
  label?: string;
  /** Called when the user dismisses the modal (Escape, click outside, or `close()` of the handle). */
  onClose?: () => void;
}

export interface ActiveModal { id: number; spec: ModalSpec }

interface ModalState { current: ActiveModal | null }

export const useModal = create<ModalState>(() => ({ current: null }));

let nextId = 1;

/** Close the modal; with `id`, only if it is still that modal (a stale dialog must not close a newer one). */
export function closeModal(id?: number): void {
  const { current } = useModal.getState();
  if (current && (id === undefined || current.id === id)) useModal.setState({ current: null });
}

export function openModal(spec: ModalSpec): { id: number; close: () => void } {
  const id = nextId++;
  useModal.setState({ current: { id, spec } });
  return { id, close: () => { closeModal(id); spec.onClose?.(); } };
}
