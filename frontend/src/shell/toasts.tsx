// Toast stack in #toasts. Each toast has a tone (accent bar + badge), an optional action, and a countdown bar;
// the countdown pauses while the pointer is over the stack so nothing vanishes mid-read.
import { memo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useToasts, type Toast, type ToastTone } from "../core/toast-store";
import { Icon, type IconName } from "../ui/atoms/icon";
import { KindIcon } from "../ui/atoms/kind-icon";

const TONE_ICON: Record<ToastTone, IconName> = {
  info: "info", blocked: "alert", done: "check", error: "alert", exited: "close", update: "up",
};

/** Auto-dismiss after `ms`, pausing (and later resuming with the time left) while `paused.current` is set. */
function useAutoDismiss(id: number, ms: number, rootRef: React.RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let left = ms;
    let startedAt = Date.now();
    let timer: number | undefined = window.setTimeout(close, left);
    function close(): void { useToasts.getState().dismiss(id); }
    const pause = (): void => {
      if (timer === undefined) return;
      window.clearTimeout(timer);
      timer = undefined;
      left -= Date.now() - startedAt;
    };
    const resume = (): void => {
      if (timer !== undefined) return;
      startedAt = Date.now();
      timer = window.setTimeout(close, Math.max(left, 1200));
    };
    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerleave", resume);
    el.addEventListener("focusin", pause);
    el.addEventListener("focusout", resume);
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerleave", resume);
      el.removeEventListener("focusin", pause);
      el.removeEventListener("focusout", resume);
    };
  }, [id, ms, rootRef]);
}

type CardToast = Pick<Toast, "title" | "sub" | "lead" | "tone" | "action" | "ms">;

/** Pure toast markup. Without `onRun`/`onDismiss` it is a static sample (Inbox side panel): no countdown, no click. */
export function ToastCard({ toast, onRun, onDismiss, cardRef }: {
  toast: CardToast; onRun?: () => void; onDismiss?: () => void; cardRef?: React.Ref<HTMLDivElement>;
}) {
  const { lead, tone } = toast;
  return (
    <div ref={cardRef} className={`toast t-${tone}${onRun ? " clickable" : ""}${onDismiss ? "" : " static"}`}
      role={tone === "error" || tone === "blocked" ? "alert" : "status"} style={{ ["--ms" as string]: `${toast.ms}ms` }}
      onClick={onRun}>
      <span className="tbadge">
        {lead?.type === "kind" ? <KindIcon kind={lead.kind} /> : null}
        <span className="tglyph"><Icon name={TONE_ICON[tone]} cls="i" /></span>
      </span>
      <div className="tbody">
        <b className="ttitle">{toast.title}</b>
        {toast.sub ? <div className="sub">{toast.sub}</div> : null}
      </div>
      {toast.action && onRun ? <button className="tact" onClick={(e) => { e.stopPropagation(); onRun(); }}>{toast.action}</button> : null}
      {onDismiss ? <button className="ibtn tx" aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); onDismiss(); }}>×</button> : null}
      {onDismiss ? <span className="tbar" /> : null}
    </div>
  );
}

const Item = memo(function Item({ toast }: { toast: Toast }) {
  const ref = useRef<HTMLDivElement>(null);
  const dismiss = useToasts.getState().dismiss;
  useAutoDismiss(toast.id, toast.ms, ref);
  const run = toast.onClick ? () => { dismiss(toast.id); toast.onClick?.(); } : undefined;
  return <ToastCard toast={toast} cardRef={ref} onRun={run} onDismiss={() => dismiss(toast.id)} />;
});

export function Toasts() {
  const toasts = useToasts((s) => s.toasts);
  const root = document.getElementById("toasts");
  return root ? createPortal(toasts.map((t) => <Item key={t.id} toast={t} />), root) : null;
}
