// Toast queue. `lead` is the small icon in front of the title; `tone` colours the accent bar and badge.
// Auto-dismiss is driven by the toast component (it pauses while hovered), `ms` is how long a toast lives.
import { create } from "zustand";

export type ToastLead = { type: "done" } | { type: "kind"; kind: string } | null;
export type ToastTone = "info" | "blocked" | "done" | "error" | "exited" | "update";

export interface ToastOptions {
  tone?: ToastTone;
  /** Label of the call-to-action shown on the right ("Open", "Update"…). Clicking anywhere also runs onClick. */
  action?: string;
  /** Override the lifetime; "needs you" toasts live longer than confirmations. */
  ms?: number;
}

export interface Toast {
  id: number;
  title: string;
  sub: string;
  lead: ToastLead;
  tone: ToastTone;
  action: string;
  ms: number;
  onClick: (() => void) | null;
}

interface ToastState {
  toasts: Toast[];
  push: (title: string, sub?: string, onClick?: (() => void) | null, lead?: ToastLead, opts?: ToastOptions) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;
export const TOAST_MS = 6000;
export const TOAST_MS_BY_TONE: Record<ToastTone, number> = {
  info: TOAST_MS, done: TOAST_MS, exited: TOAST_MS, update: 10000, error: 9000, blocked: 15000,
};
export const MAX_TOASTS = 4;

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push(title, sub = "", onClick = null, lead = null, opts = {}) {
    const tone = opts.tone ?? "info";
    const next: Toast = {
      id: nextId++, title, sub, lead, tone, onClick,
      action: opts.action ?? "", ms: opts.ms ?? TOAST_MS_BY_TONE[tone],
    };
    set({ toasts: [...get().toasts, next].slice(-MAX_TOASTS) });
  },
  dismiss(id) { set({ toasts: get().toasts.filter((t) => t.id !== id) }); },
}));

export const toast = (title: string, sub = "", onClick: (() => void) | null = null, lead: ToastLead = null,
  opts: ToastOptions = {}) => useToasts.getState().push(title, sub, onClick, lead, opts);

export const errorToast = (err: unknown) =>
  toast("Something went wrong", err instanceof Error ? err.message : String(err), null, null, { tone: "error" });
