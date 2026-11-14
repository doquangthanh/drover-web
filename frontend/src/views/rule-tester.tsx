// Detection rule tester: runs the rules against a live pane screen and shows which rule matched (read-only RPC).
import { useMemo, useState } from "react";
import { useStore } from "../core/store";
import { useRpc } from "./use-rpc";

const PILL: Record<string, [string, string]> = {
  blocked: ["blocked", "Needs you"], working: ["info", "Working"], done: ["ok", "Done"], idle: ["", "Idle"],
};
const MATCH = { color: "var(--blocked)" };

interface RuleResult { rule_id: string; state: string; priority: number; region: string; matched: boolean }
interface TestResult { detected?: string; title?: string; screen: string[]; results: RuleResult[]; state: string; osc7501?: string }

export function RuleTester() {
  const allPanes = useStore((s) => s.panes);
  const panes = useMemo(() => allPanes.filter((p) => !p.machine || p.machine === "local"), [allPanes]);
  const [chosen, setChosen] = useState<string | null>(null);
  const pane = chosen && panes.some((p) => p.id === chosen) ? chosen : panes[0]?.id || null;
  const { data: r, error, reload } = useRpc<TestResult>("rules.test", { pane }, [pane]);

  if (!pane) return <div className="panel" style={{ flex: 1, padding: 12 }}><div className="meta">Start an agent to test rules against its screen.</div></div>;
  if (error && !r) return <div className="errtext">{error}</div>;
  if (!r) return null;
  const [cls, text] = PILL[r.detected || ""] || ["", r.detected || "no rule matched"];
  return (
    <>
      <div className="panel" style={{ flex: 1, minWidth: 0 }}>
        <div className="ph s32">
          <span className="grow">Test against</span>
          <select className="seg" aria-label="Pane to test" value={pane} onChange={(e) => setChosen(e.target.value)}>
            {panes.map((p) => <option key={p.id} value={p.id}>{`${p.name} · live screen`}</option>)}
          </select>
          <button className="seg" onClick={reload}>Run again</button>
        </div>
        <div className="codebox bare">{`title: ${r.title || ""}\n${r.screen.join("\n")}`}</div>
      </div>
      <div className="panel rtres">
        <div className="rt meta"><span>Rule</span><span>Prio</span><span>Region</span><span>Result</span></div>
        {r.results.map((x, i) => (
          <div className="rt" key={i}>
            <span style={x.matched ? MATCH : undefined}>{`${x.rule_id} → ${x.state}`}</span>
            <span>{x.priority}</span><span className="mono">{x.region}</span>
            <span className={x.matched ? "" : "meta"} style={x.matched ? MATCH : undefined}>{x.matched ? "match" : "no match"}</span>
          </div>
        ))}
        <div className="row" style={{ marginTop: 12 }}>
          <span>Result</span><span className={`pill ${cls}`}>{text}</span>
          <span className="meta">{`current state ${r.state}${r.osc7501 ? " · OSC 7501 says " + r.osc7501 : ""}`}</span>
        </div>
      </div>
    </>
  );
}
