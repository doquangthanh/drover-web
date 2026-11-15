// Settings > Updates: compare against the latest GitHub release and install it with one click.
import { useState } from "react";
import { conn } from "../core/connection";
import { useRpc } from "./use-rpc";

interface UpdateInfo { current: string; latest: string; tag: string; url: string; notes: string; available: boolean; installable: boolean }

export function UpdatePanel() {
  const { data, error, loading, reload } = useRpc<UpdateInfo>("update.check");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [fail, setFail] = useState<string | null>(null);

  const install = async () => {
    if (!data || !window.confirm("Update Drover now? The server restarts, so running agents stop (the session can be restored).")) return;
    setBusy(true); setFail(null);
    try { await conn.rpc("update.apply", { tag: data.tag }); setDone(true); }
    catch (e) { setFail((e as Error).message); setBusy(false); }
  };

  return (
    <div className="appearance">
      <div className="alab">UPDATES</div>
      <p style={{ margin: "8px 0" }}>Installed: <span className="mono">v{data?.current ?? "…"}</span></p>
      {error && !data ? <p className="errtext">{error}</p> : null}
      {data && !data.available ? <p style={{ color: "var(--done)" }}>✓ Drover is up to date{data.latest ? ` (latest: v${data.latest})` : ""}</p> : null}
      {data?.available ? (
        <>
          <p>New version <span className="mono">v{data.latest}</span> is available. <a href={data.url} target="_blank" rel="noreferrer">Release notes</a></p>
          {data.notes ? <pre className="meta mono" style={{ whiteSpace: "pre-wrap", maxHeight: 180, overflow: "auto" }}>{data.notes}</pre> : null}
          {data.installable
            ? <button className="btn pri" disabled={busy || done} onClick={install}>{done ? "Updated: restarting…" : busy ? "Updating…" : `Update to v${data.latest}`}</button>
            : <p className="meta">Installed from source: update with <span className="mono">git pull</span> (or <span className="mono">uv tool upgrade</span>). Release builds for Windows and Linux update here.</p>}
        </>
      ) : null}
      {fail ? <p className="errtext">{fail}</p> : null}
      <p style={{ marginTop: 14 }}><button className="btn" disabled={loading || busy} onClick={reload}>{loading ? "Checking…" : "Check for updates"}</button></p>
    </div>
  );
}
