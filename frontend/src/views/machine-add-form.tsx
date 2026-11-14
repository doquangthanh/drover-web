// "Add a machine" form (SSH target, install, test). All state is local, so machine status events never disturb typing.
import { useState, type ReactNode } from "react";
import { conn } from "../core/connection";
import { toast } from "../core/toast-store";

type Log = { kind: "busy"; text: string } | { kind: "steps"; steps: string[]; error?: string } | { kind: "error"; text: string } | null;

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="lab" htmlFor={id}>{label}</label>{children}
      {hint ? <div className="meta" style={{ marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}

export function MachineAddForm() {
  const [alias, setAlias] = useState("");
  const [target, setTarget] = useState("");
  const [port, setPort] = useState("22");
  const [key, setKey] = useState("");
  const [install, setInstall] = useState(false);
  const [log, setLog] = useState<Log>(null);
  const params = () => ({ alias: alias.trim(), target: target.trim(), port: Number(port) || 22, key: key.trim() });

  const test = async () => {
    setLog({ kind: "busy", text: "Testing SSH…" });
    try {
      const r = await conn.rpc("machine.test", params());
      setLog({ kind: "steps", steps: r.steps, error: r.ok ? undefined : r.error });
    } catch (e) { setLog({ kind: "error", text: (e as Error).message }); }
  };
  const add = async () => {
    setLog({ kind: "busy", text: install ? "Installing hd and connecting…" : "Adding…" });
    try {
      await conn.rpc("machine.add", { ...params(), install });
      toast(`Added ${alias.trim()}`);
      setAlias(""); setTarget(""); setLog(null);
    } catch (e) { setLog({ kind: "error", text: (e as Error).message }); }
  };

  return (
    <aside className="madd">
      <div style={{ fontWeight: 600, fontSize: 14 }}>Add a machine</div>
      <div className="madd-body">
        <Field id="m-a" label="Name"><input className="in" id="m-a" placeholder="vps-2" value={alias} onChange={(e) => setAlias(e.target.value)} /></Field>
        <Field id="m-h" label="SSH target" hint="user@host or a Host from ~/.ssh/config">
          <input className="in mono" id="m-h" placeholder="deploy@vps-2.tail-net" value={target} onChange={(e) => setTarget(e.target.value)} />
        </Field>
        <div className="row">
          <div style={{ width: 90 }}><Field id="m-p" label="Port"><input className="in" id="m-p" value={port} onChange={(e) => setPort(e.target.value)} /></Field></div>
          <div className="grow"><Field id="m-k" label="Key file">
            <input className="in mono" id="m-k" placeholder="Use ssh-agent / default keys" value={key} onChange={(e) => setKey(e.target.value)} />
          </Field></div>
        </div>
        <label className="ck"><input type="checkbox" checked={install} onChange={(e) => setInstall(e.target.checked)} />Install hd there if missing (Linux/macOS)</label>
        <div className="meta">Host keys are checked against known_hosts. The daemon there only listens on 127.0.0.1; herd reaches it through the SSH tunnel.</div>
        <div className="box" hidden={!log}>
          {log?.kind === "busy" ? <div className="row"><span className="spin" />{log.text}</div> : null}
          {log?.kind === "steps" ? <>{log.steps.map((s, i) => <div key={i}>{"✓ " + s}</div>)}{log.error ? <div className="errtext">{log.error}</div> : null}</> : null}
          {log?.kind === "error" ? <div className="errtext">{log.text}</div> : null}
        </div>
        <span className="grow" />
        <div className="mono meta">hd machine add &lt;name&gt; &lt;ssh target&gt;</div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn" onClick={test}>Test only</button><button className="btn pri" onClick={add}>Add</button>
        </div>
      </div>
    </aside>
  );
}
