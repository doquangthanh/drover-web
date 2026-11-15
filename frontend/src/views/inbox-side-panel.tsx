// Inbox side panel (desktop): what a notification looks like and which events notify you (settings.toml [notify]).
import { conn } from "../core/connection";
import { useStore } from "../core/store";
import { errorToast } from "../core/toast-store";
import { ToastCard } from "../shell/toasts";
import { channelLabel, type AgentPane } from "./views-logic";

function SampleToast({ pane, kind }: { pane: AgentPane; kind: "done" | "blocked" }) {
  return (
    <ToastCard toast={{
      title: kind === "done" ? `${pane.name} finished` : `${pane.name} needs you`, sub: pane.title || pane.command || "",
      lead: { type: "kind", kind: pane.kind || "" }, tone: kind, action: "", ms: 0,
    }} />
  );
}

function Row({ name, value, dim }: { name: string; value: string; dim?: boolean }) {
  return <div className="nrow"><span>{name}</span><span className={dim ? "dim" : "ac"}>{value}</span></div>;
}

export function InboxSidePanel() {
  const n = (useStore((s) => s.raw.notify) || {}) as Record<string, any>;
  const blocked = useStore((s) => s.panes.find((p) => p.state === "blocked"));
  const done = useStore((s) => s.panes.find((p) => p.state === "done"));
  const quiet = String(n.quiet_hours || "").replace("-", " – ");
  return (
    <aside className="inbox-side desk" aria-label="Notifications">
      <div className="meta">In-app toast</div>
      {blocked ? <SampleToast pane={blocked} kind="blocked" /> : null}
      {done ? <SampleToast pane={done} kind="done" /> : null}
      {!blocked && !done ? <div className="meta">Toasts appear here and bottom-right when an agent needs you or finishes.</div> : null}
      <div className="meta" style={{ marginTop: 6 }}>Notify me when</div>
      <div className="nlist">
        <Row name="An agent needs me" value={channelLabel(n.blocked || ["toast", "desktop", "sound"])} />
        <Row name="An agent finishes" value={channelLabel(n.done || ["toast", "desktop"])} />
        <Row name="An agent crashes" value={channelLabel(n.exited || ["toast", "desktop"], true)} />
        <Row name="Quiet hours" value={quiet || "Off"} dim={!quiet} />
      </div>
      <div className="meta">Edit these in Settings ▸ Notifications.</div>
      <button className="btn sm" style={{ alignSelf: "flex-start" }} onClick={() => conn.rpc("notify.test").catch(errorToast)}>
        Send a test notification
      </button>
    </aside>
  );
}
