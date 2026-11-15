// Agent tree, Flow tab: one swimlane per agent of the selected tree ("you" first), one arrow per messages.list entry,
// and a bar per helper showing when it was active. Events that don't touch the selected subtree are dimmed.
import { useMemo } from "react";
import { KindIcon } from "../ui/atoms/kind-icon";
import { activityBars, buildFlowEvents, hhmm, laneCenter, SUB_KIND, touches, type AgentMessage } from "./agent-flow-logic";
import { stateLabel } from "./agent-tree-inspector";
import { paneLabel } from "./agent-tree-list";
import type { AgentPane } from "./views-logic";

const ROW = 48, PAD = 8, LINE = 28, LANE_MIN = 124, GUTTER = 64;
const LEGEND: [string, string][] = [
  ["spawn", "started · dr run"], ["send", "sends · dr send"], ["done", "finished"],
  ["wait", "waits · dr wait"], ["blocked", "needs you"], ["denied", "blocked by policy"],
  ["sub-start", "delegates · sub-agent"],
];

export function AgentFlowBoard({ messages, laneIds, paneById, selected, focus }: {
  messages: AgentMessage[]; laneIds: string[]; paneById: Map<string, AgentPane>;
  selected: string; focus: Set<string> | null;  // null = the whole tree is selected, nothing dims
}) {
  const events = useMemo(() => buildFlowEvents(messages, laneIds), [messages, laneIds]);
  const bars = useMemo(() => activityBars(messages, laneIds, paneById), [messages, laneIds, paneById]);
  const n = laneIds.length;

  return (
    <>
      <div className="at-legend">
        {LEGEND.map(([k, label]) => <span key={k} className={`k-${k}`}><i />{label}</span>)}
        <span><i className="bar" />agent active</span>
      </div>
      {!events.length ? (
        <div className="meta at-empty">No agent-to-agent activity yet. Agents use `dr run`, `dr wait`, `dr send`.</div>
      ) : (
        <div className="at-scroll">
          <div style={{ minWidth: GUTTER + n * LANE_MIN }}>
            <div className="at-lanes" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {laneIds.map((id) => {
                const p = paneById.get(id);
                return (
                  <div key={id || "you"} className={"at-lane" + (id === selected ? " on" : "")}>
                    <div className={p ? `s-${p.state}` : "s-idle"}>
                      {p ? <KindIcon kind={p.kind} /> : <span className="ic" style={{ background: "var(--raised)" }}>you</span>}
                      <span className="nm trunc">{p ? paneLabel(p) : "you"}</span>
                      <span className="st">{!p ? "you" : p.kind === SUB_KIND ? `sub-agent · ${stateLabel(p)}` : stateLabel(p)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="at-rows">
              <div className="at-overlay" aria-hidden="true">
                {laneIds.map((id, i) => (
                  <span key={id || "you"} className={"at-life" + (id === selected ? " on" : "")} style={{ left: `${laneCenter(i, n)}%` }} />
                ))}
                {bars.map((b) => (
                  <span key={b.lane} className={`at-bar s-${b.state}` + (b.live ? " live" : "")} style={{
                    left: `${laneCenter(b.lane, n)}%`, top: PAD + b.startRow * ROW + LINE,
                    height: Math.max((b.endRow - b.startRow) * ROW, 8) + (b.live ? 14 : 0),
                  }} />
                ))}
              </div>
              {events.map((e, i) => {
                const who = (id: string) => paneLabel(paneById.get(id)) || id || "you";
                const label = `${who(e.source)} ${e.verb} ${who(e.target)}`;
                const dim = focus && !touches(e, focus);
                return (
                  <div key={i} className={`at-ev k-${e.kind}` + (dim ? " dim" : "")}>
                    <span className="at-time">{hhmm(e.at)}</span>
                    <div className="at-track">
                      {e.widthPct > 0
                        ? <span className={"at-line " + (e.toRight ? "r" : "l")} style={{ left: `${e.leftPct}%`, width: `${e.widthPct}%` }} />
                        : null}
                      <span className="at-src" style={{ left: `${e.fromPct}%` }} />
                      <span className="at-pill" title={e.text ? `${label}: ${e.text}` : label}
                        style={{ left: `${e.midPct}%`, maxWidth: `${Math.max(e.widthPct - 2, 90 / n)}%` }}>
                        <b>{e.verb}</b>{e.text ? <span>{e.text}</span> : null}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
