// Promise-based prompt/confirm built on the modal store.
import type { RefObject } from "react";
import { closeModal, openModal } from "./modal-store";

function PromptBody({ label, value, inputRef, onSubmit }: {
  label: string; value: string; inputRef: RefObject<HTMLInputElement | null>; onSubmit: (v: string) => void;
}) {
  return (
    <div className="mbody">
      <label className="lab">{label}</label>
      <input ref={inputRef} className="in" defaultValue={value} aria-label={label} autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") onSubmit(e.currentTarget.value.trim()); }} />
    </div>
  );
}

/** Resolves with the trimmed text, or null when cancelled. */
export function promptText(title: string, value = "", label = "Name"): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    let modalId = 0;
    const inputRef: RefObject<HTMLInputElement | null> = { current: null };
    const finish = (v: string | null) => { if (!settled) { settled = true; closeModal(modalId); resolve(v); } };
    const { id } = openModal({
      title,
      body: <PromptBody label={label} value={value} inputRef={inputRef} onSubmit={finish} />,
      foot: (
        <>
          <span className="grow" />
          <button className="btn" onClick={() => finish(null)}>Cancel</button>
          <button className="btn pri" onClick={() => finish((inputRef.current?.value ?? value).trim())}>Save</button>
        </>
      ),
      onClose: () => finish(null),
    });
    modalId = id;
  });
}

/** Resolves true on the confirm button, false on cancel/dismiss. */
export function confirmBox(title: string, text: string, okLabel = "OK", danger = false): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    let modalId = 0;
    const finish = (v: boolean) => { if (!settled) { settled = true; closeModal(modalId); resolve(v); } };
    const { id } = openModal({
      title, size: "sm",
      body: (
        <div className="mbody" style={{ padding: 18 }}>
          <div style={{ lineHeight: 1.55, color: "var(--tfg)", whiteSpace: "pre-line" }}>{text}</div>
        </div>
      ),
      foot: (
        <>
          <span className="grow" />
          <button className="btn" onClick={() => finish(false)}>Cancel</button>
          <button className={`btn ${danger ? "dng" : "pri"}`} autoFocus onClick={() => finish(true)}>{okLabel}</button>
        </>
      ),
      onClose: () => finish(false),
    });
    modalId = id;
  });
}
