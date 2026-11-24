// Changes view: the post-run checks of the selected worktree: one chip per step, its output on click, run / stop.
import { useEffect, useState } from "react";
import { checkBusy, checkForFolder } from "../core/checks-logic";
import type { CheckRun } from "../core/protocol-types";
import { useStore } from "../core/store";
import { toast } from "../core/toast-store";
import type { Rpc } from "./use-changes-data";

const MARK: Record<string, string> = { passed: "✓", failed: "✗", timeout: "⏱", error: "✗", running: "…", pending: "·", cancelled: "–" };
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

/** Nothing is shown for a folder with no checks configured and no result (the strip would only be noise). */
export function ChecksStrip({ rpc, path }: { rpc: Rpc; path: string }) {
  const live = useStore((s) => checkForFolder(s.raw.checks, path));
  const [run, setRun] = useState<CheckRun | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const stamp = live ? `${live.status}|${live.finished_at}|${live.passed}` : "";

  useEffect(() => {
    let dead = false;
    const load = () => rpc<CheckRun>("check.list", { cwd: path }).then((r) => { if (!dead) setRun(r); }, () => { if (!dead) setRun(null); });
    void load();
    // A remote machine's events do not reach the local state: poll while a run is going.
    const timer = run && checkBusy(run) ? window.setInterval(load, 1500) : undefined;
    return () => { dead = true; if (timer) window.clearInterval(timer); };
  }, [rpc, path, stamp, run?.status]);

  useEffect(() => {
    let dead = false;
    setConfigured(null);
    rpc<{ steps: unknown[]; source: string }>("check.config", { cwd: path }).then(
      (c) => { if (!dead) setConfigured(c.steps.length > 0 || c.source === "untrusted"); }, () => { if (!dead) setConfigured(false); });
    return () => { dead = true; };
  }, [rpc, path]);

  if (!run && !configured) return null;
  const busy = run ? checkBusy(run) : false;
  const act = (method: "check.run" | "check.cancel") => rpc(method, { cwd: path }).then(() => rpc<CheckRun>("check.list", { cwd: path }).then(setRun, () => {}),
    (e: Error) => toast("Checks", e.message, null, null, { tone: "error" }));
  const shown = run?.results.find((r) => r.name === open);
  return (
    <div className="chk">
      <div className="chkrow">
        <span className="meta">Checks</span>
        {run ? run.results.map((r) => (
          <button key={r.name} className={`chkstep ${r.status}${open === r.name ? " on" : ""}`} onClick={() => setOpen(open === r.name ? null : r.name)}
            title={r.command.join(" ")}>
            <span>{MARK[r.status] ?? "?"}</span> {r.name}{r.ms ? <span className="dim"> {seconds(r.ms)}</span> : null}
          </button>
        )) : <span className="meta">not run yet</span>}
        <span className="grow" />
        {busy ? <button className="btn" onClick={() => act("check.cancel")}>Stop</button> : <button className="btn" onClick={() => act("check.run")}>Run checks</button>}
      </div>
      {shown?.output ? <pre className="chkout mono">{shown.output}</pre> : null}
    </div>
  );
}
