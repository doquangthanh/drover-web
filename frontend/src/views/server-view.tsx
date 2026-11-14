// herd-server status: process, clients, config problems. (The restore dialog lives with the overlays.)
import { useEffect } from "react";
import { conn } from "../core/connection";
import { errorToast } from "../core/toast-store";
import { clearTopExtra, setTopExtra } from "../shell/top-extra-store";
import { useRpc } from "./use-rpc";
import { uptimeLabel } from "./views-logic";

interface ServerInfo {
  uptime: number; pid: number; version: string; port: number; session_saved: boolean; config_dir: string;
  counts: Record<string, number>; clients: { label: string }[]; rule_errors: string[]; settings_errors: string[];
}

function Kv({ rows }: { rows: [string, string, boolean?][] }) {
  return <div className="kv">{rows.map(([k, v, mono]) => <KvRow key={k} k={k} v={v} mono={mono} />)}</div>;
}
const KvRow = ({ k, v, mono }: { k: string; v: string; mono?: boolean }) => <><span>{k}</span><span className={mono ? "mono trunc" : ""}>{v}</span></>;

export default function ServerView() {
  const { data: info, error } = useRpc<ServerInfo>("server.info");
  const uptime = info ? uptimeLabel(info.uptime) : null;

  useEffect(() => {
    if (!uptime) return;
    setTopExtra("server", {
      meta: <><span className="dot ok" /><span className="meta">{`running · up ${uptime}`}</span></>,
      right: <button className="btn" onClick={() => conn.rpc("server.stop").catch(() => {})} title="Agents stop too">Stop</button>,
    });
  }, [uptime]);
  useEffect(() => () => clearTopExtra("server"), []);

  if (error && !info) return <div className="view errtext">{error}</div>;
  if (!info) return null;
  const counts = Object.entries(info.counts).map(([k, v]) => `${v} ${k}`).join(" · ") || "none";
  return (
    <div className="view dview">
      <div className="bx">
        <div className="bh">Status</div>
        <Kv rows={[
          ["Process", `pid ${info.pid} · hd ${info.version}`, true], ["Listening", `127.0.0.1:${info.port} (this machine only)`, true],
          ["Session file", `session.json · ${info.session_saved ? "saved" : "not saved yet"}`, true],
          ["Config", info.config_dir, true], ["Agents", counts],
        ]} />
      </div>
      <div className="bx">
        <div className="bh">{`Connected clients · ${info.clients.length}`}</div>
        {info.clients.map((c, i) => <div className="rr" key={i} style={{ padding: 0 }}><span className="dot ok" /><span className="grow">{c.label}</span></div>)}
      </div>
      {[...info.rule_errors, ...info.settings_errors].map((e, i) => <div key={i} className="errtext" style={{ gridColumn: "span 2" }}>{e}</div>)}
      <div className="row" style={{ gridColumn: "span 2" }}>
        <button className="btn" onClick={() => conn.rpc("notify.test").catch(errorToast)}>Test notification</button>
        <span className="meta">Closing the window never stops agents. Stopping the server does.</span>
      </div>
    </div>
  );
}
