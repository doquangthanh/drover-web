// Toast stack in #toasts. Auto-dismiss (6 s) lives in the toast store; click runs the toast's action.
import { memo } from "react";
import { createPortal } from "react-dom";
import { useToasts, type Toast } from "../core/toast-store";
import { KindIcon } from "../ui/atoms/kind-icon";

const Item = memo(function Item({ toast }: { toast: Toast }) {
  const dismiss = useToasts.getState().dismiss;
  const { lead } = toast;
  return (
    <div className="toast" role="status" onClick={() => { dismiss(toast.id); toast.onClick?.(); }}>
      <div className="row">
        {lead?.type === "done" ? <span className="dot done" /> : lead?.type === "kind" ? <KindIcon kind={lead.kind} /> : null}
        <b className="grow">{toast.title}</b>
        <button className="ibtn tx" aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }}>×</button>
      </div>
      {toast.sub ? <div className="sub">{toast.sub}</div> : null}
    </div>
  );
});

export function Toasts() {
  const toasts = useToasts((s) => s.toasts);
  const root = document.getElementById("toasts");
  return root ? createPortal(toasts.map((t) => <Item key={t.id} toast={t} />), root) : null;
}
