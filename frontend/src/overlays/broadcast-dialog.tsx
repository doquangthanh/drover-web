// "Send to several agents" (Ctrl+A B).
import { useState } from "react";
import { conn } from "../core/connection";
import { useStore } from "../core/store";
import { errorToast } from "../core/toast-store";
import { KindIcon } from "../ui/atoms/kind-icon";
import { closeModal, openModal } from "./modal-store";

function Broadcast() {
  const panes = useStore.getState().panes.filter((p) => p.state !== "exited"); // snapshot at open, like the old dialog
  const spaceById = useStore.getState().spaceById;
  const [text, setText] = useState("");
  const [on, setOn] = useState(() => new Set(panes.filter((p) => p.kind !== "shell").map((p) => p.id)));

  const toggle = (id: string) => setOn((prev) => { const n = new Set(prev); if (!n.delete(id)) n.add(id); return n; });
  const send = () => {
    const t = text.trim();
    if (t) panes.filter((p) => on.has(p.id)).forEach((p) => conn.rpc("pane.send", { pane: p.id, text: t }).catch(errorToast));
    closeModal();
  };

  return (
    <>
      <div className="mhead"><h2>Send to several agents</h2></div>
      <div className="mbody">
        <textarea className="in" rows={3} placeholder="Prompt to send" aria-label="Prompt" autoFocus value={text} onChange={(e) => setText(e.target.value)} />
        {panes.map((p) => (
          <label className="ck" key={p.id}>
            <input type="checkbox" checked={on.has(p.id)} onChange={() => toggle(p.id)} />
            <KindIcon kind={p.kind} />{p.name}
            <span className="meta">{(p.space_id && spaceById.get(p.space_id)?.name) || ""}</span>
          </label>
        ))}
      </div>
      <div className="mfoot">
        <span className="grow" />
        <button className="btn" onClick={() => closeModal()}>Cancel</button>
        <button className="btn pri" onClick={send}>Send</button>
      </div>
    </>
  );
}

export function openBroadcast(): void {
  openModal({ label: "Send to several agents", body: <Broadcast /> });
}
