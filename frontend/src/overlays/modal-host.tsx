// Renders the active modal into #overlay-root. Same markup/classes as the vanilla modal.js.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { hooks } from "../actions/feature-hooks";
import { useStore } from "../core/store";
import { useModal, type ActiveModal } from "./modal-store";

function Modal({ active }: { active: ActiveModal }) {
  const { spec } = active;
  const modal = useRef<HTMLDivElement>(null);
  const dismiss = () => { useModal.setState({ current: null }); spec.onClose?.(); };

  useEffect(() => {
    const el = modal.current;
    if (!el) return;
    // React's autoFocus already focused an input/button that asked for it; otherwise pick the first control.
    if (!el.contains(document.activeElement)) (el.querySelector<HTMLElement>("[autofocus], input, textarea, button") || el).focus();
    // Closing for good (not swapping to another modal): hand focus back to the focused terminal.
    return () => { if (!useModal.getState().current) hooks.focusTerminal(useStore.getState().ui.focusedPane); };
  }, []);

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) dismiss(); }}
      onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); dismiss(); } }}>
      <div ref={modal} className={`modal ${spec.size || ""}`} role="dialog" aria-modal="true" aria-label={spec.label || spec.title} tabIndex={-1}>
        {spec.head || (spec.title ? <div className="mhead"><h2>{spec.title}</h2></div> : null)}
        {spec.body}
        {spec.foot ? <div className="mfoot">{spec.foot}</div> : null}
      </div>
    </div>
  );
}

export function ModalHost() {
  const current = useModal((s) => s.current);
  const root = document.getElementById("overlay-root");
  if (!current || !root) return null;
  return createPortal(<Modal key={current.id} active={current} />, root);
}
