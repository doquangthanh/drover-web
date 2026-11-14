// One inbox entry. Memoised: re-renders only when its own pane (or focus/helper count) changes.
import { memo } from "react";
import { allActions } from "../actions/build-actions";
import { conn } from "../core/connection";
import { ago } from "../core/format";
import { errorToast } from "../core/toast-store";
import { KindIcon } from "../ui/atoms/kind-icon";
import { StateMark } from "../ui/atoms/state-mark";
import type { AgentPane } from "./views-logic";

const WHEN: Record<string, string> = { blocked: "waiting", done: "finished", exited: "exited" };
const send = (pane: string, data: string) => conn.rpc("pane.write", { pane, data }).catch(errorToast);
const open = (id: string) => allActions.focusPane(id);

interface Props { pane: AgentPane; spaceName: string; helpers: number; focused: boolean }

export const InboxCard = memo(function InboxCard({ pane, spaceName, helpers, focused }: Props) {
  const where = `${spaceName}${pane.machine && pane.machine !== "local" ? " · " + pane.machine : " · This computer"}`;
  const when = WHEN[pane.state];
  const age = `${when ? when + " " : ""}${ago(pane.since || pane.created_at || 0)}${when && pane.state !== "blocked" ? " ago" : ""}`;
  const detail = helpers && pane.state === "working" ? `spawned ${helpers} helper${helpers > 1 ? "s" : ""}` : age;
  const topInner = (
    <>
      <KindIcon kind={pane.kind} /><span className="nm">{pane.name}</span>
      <span className="meta grow">{`${where} · ${detail}`}</span><StateMark pane={pane} />
      {pane.unread ? <span className="dot unread" /> : null}
    </>
  );
  if (pane.state !== "blocked" && pane.state !== "done" && pane.state !== "exited") {
    return <div className="lrow" onClick={() => open(pane.id)} style={{ cursor: "pointer" }}>{topInner}</div>;
  }
  return (
    <div className={"card" + (focused ? " on" : "")}>
      <div className="top">{topInner}</div>
      {pane.state === "blocked" ? (
        <>
          <div className="ex">{pane.title ? pane.title : "Waiting for your answer"}</div>
          <div className="row">
            <button className="btn pri" onClick={() => send(pane.id, "1")}>1 · Yes</button>
            <button className="btn" onClick={() => send(pane.id, "2")}>2</button>
            <button className="btn" onClick={() => send(pane.id, "3")}>3 · No…</button>
            <span className="grow" />
            <button className="btn" onClick={() => send(pane.id, "\x1b")}>Send Esc</button>
            <button className="btn" onClick={() => open(pane.id)}>Open</button>
          </div>
        </>
      ) : pane.state === "exited" ? (
        <div className="row">
          <span className="meta grow">{`exit code ${pane.exit_code ?? "?"}`}</span>
          <button className="btn" onClick={() => conn.rpc("pane.restart", { pane: pane.id }).catch(errorToast)}>Restart &amp; resume</button>
          <button className="btn" onClick={() => conn.rpc("pane.close", { pane: pane.id }).catch(errorToast)}>Dismiss</button>
        </div>
      ) : (
        <>
          {pane.title ? <div className="ex dimmer">{pane.title}</div> : null}
          <div className="row">
            <span className="grow" />
            <button className="btn" onClick={() => conn.rpc("pane.focus", { pane: pane.id })}>Mark read</button>
            <button className="btn" onClick={() => open(pane.id)}>Open</button>
          </div>
        </>
      )}
    </div>
  );
});
