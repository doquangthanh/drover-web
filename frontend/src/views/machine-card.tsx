// Connection card of one remote machine (and the fixed "This computer" card).
import { conn } from "../core/connection";
import type { Machine } from "../core/protocol-types";
import { errorToast } from "../core/toast-store";
import { hooks } from "../actions/feature-hooks";
import { Icon } from "../ui/atoms/icon";

function StatusPill({ m }: { m: Machine }) {
  if (m.status === "connected") return <span className="pill ok">{m.latency_ms != null ? `${m.latency_ms} ms` : "Connected"}</span>;
  if (m.status === "connecting") return <span className="pill info">Connecting</span>;
  return <span className="pill bad">{m.status === "retrying" ? "Retrying" : "Unreachable"}</span>;
}

export function LocalCard({ spaces, agents }: { spaces: number; agents: number }) {
  return (
    <div className="mc">
      <div className="top"><Icon name="monitor" /><b className="grow">This computer</b><span className="pill ok">Connected</span></div>
      <div className="st"><span>{`${spaces} spaces`}</span><span>{`${agents} agents`}</span></div>
    </div>
  );
}

export function MachineCard({ m }: { m: Machine }) {
  const snap = m.snapshot || {};
  const panes = snap.panes || [];
  const retry = typeof m.retry_at === "number" ? Math.max(0, Math.round(m.retry_at - Date.now() / 1000)) : 0;
  const on = m.status === "connected";
  const need = panes.filter((p) => p.state === "blocked").length;
  const version = (m.info as { version?: string } | undefined)?.version;
  return (
    <div className="mc">
      <div className="top"><Icon name="server" /><b className="grow">{m.alias}</b><StatusPill m={m} /></div>
      {on ? (
        <div className="st"><span>{`dr ${version || "?"}`}</span><span>{`${(snap.spaces || []).length} spaces`}</span><span>{`${panes.length} agents`}</span></div>
      ) : (
        <div className="st">{retry ? <span>{`retry in ${retry}s`}</span> : null}</div>
      )}
      <div className="meta mono">{String(m.target ?? "")}</div>
      {on && need ? <div className="meta">{`${need} need${need > 1 ? "" : "s"} you`}</div>
        : !on ? <div className="meta">{m.error || "Agents there keep running; you'll see them when it's back."}</div> : null}
      <div className="row">
        {on ? <button className="btn" onClick={() => hooks.openNewAgent({ machine: m.alias })}>New agent here</button> : null}
        <button className="btn danger" onClick={() => conn.rpc("machine.remove", { alias: m.alias }).catch(errorToast)}>Remove</button>
      </div>
    </div>
  );
}
