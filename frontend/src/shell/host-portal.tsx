// Render children into one of the static shell elements of index.html (#sidebar, #topbar, #statusbar, ...).
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export function HostPortal({ id, children }: { id: string; children: ReactNode }) {
  const el = document.getElementById(id);
  return el ? createPortal(children, el) : null;
}
