// Tiny toast queue; phase 4 renders it. `lead` describes the small icon in front of the title.
import { create } from "zustand";

export type ToastLead = { type: "done" } | { type: "kind"; kind: string } | null;

export interface Toast {
  id: number;
  title: string;
  sub: string;
  lead: ToastLead;
  onClick: (() => void) | null;
}

interface ToastState {
  toasts: Toast[];
  push: (title: string, sub?: string, onClick?: (() => void) | null, lead?: ToastLead) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;
export const TOAST_MS = 6000;

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push(title, sub = "", onClick = null, lead = null) {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, title, sub, onClick, lead }] });
    setTimeout(() => get().dismiss(id), TOAST_MS);
  },
  dismiss(id) { set({ toasts: get().toasts.filter((t) => t.id !== id) }); },
}));

export const toast = (title: string, sub = "", onClick: (() => void) | null = null, lead: ToastLead = null) =>
  useToasts.getState().push(title, sub, onClick, lead);

export const errorToast = (err: unknown) =>
  toast("Something went wrong", err instanceof Error ? err.message : String(err));
