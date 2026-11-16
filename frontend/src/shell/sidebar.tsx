// Left sidebar: Spaces grouped by machine (top half), Agents grouped by space (bottom half), nav footer.
import { Fragment, useEffect, useMemo } from "react";
import { allActions } from "../actions/build-actions";
import { useStore } from "../core/store";
import { Icon, type IconName } from "../ui/atoms/icon";
import { ChatRowList, sameDir } from "../chat/chat-sidebar";
import { useChats } from "../chat/chat-store";
import { SidebarAgentRow } from "./sidebar-agent-row";
import { SidebarSpaceRow } from "./sidebar-space-row";
import { machineDot, sortedPanesOf } from "./shell-logic";
import { HostPortal } from "./host-portal";
import type { Machine } from "../core/protocol-types";

const NO_MACHINES: Machine[] = [];

function MachineHeader({ label, icon, status, onNew }: { label: string; icon: IconName; status: string; onNew: () => void }) {
  return (
    <div className="mach">
      <Icon name={icon} />
      <span className="grow trunc">{label}</span>
      <button className="ibtn" title="New space here" aria-label={`New space on ${label}`} onClick={onNew}>+</button>
      <span className={`dot ${machineDot(status)}`} title={status} />
    </div>
  );
}

function SpacesSection() {
  const local = useStore((s) => s.raw.spaces);
  const machines = useStore((s) => s.raw.machines) || NO_MACHINES;
  const selected = useStore((s) => s.ui.spaceId);
  return (
    <div className="sb-half">
      <div className="shead">
        <span>Spaces</span>
        <button className="ibtn" aria-label="New space" onClick={() => void allActions.newSpace(null)}>+</button>
      </div>
      <div className="slist">
        <MachineHeader label="This computer" icon="monitor" status="local" onNew={() => void allActions.newSpace(null)} />
        {(local || []).map((s) => <SidebarSpaceRow key={s.id} space={s} on={selected === s.id} />)}
        {!local?.length ? <div className="empty-hint">Open a folder to start: press + or Ctrl+A S.</div> : null}
        {machines.map((m) => (
          <Fragment key={m.alias}>
            <MachineHeader label={m.status === "connected" ? m.alias : `${m.alias} · ${m.status}`} icon="server"
              status={m.status || ""} onNew={() => void allActions.newSpace(m.alias)} />
            {(m.snapshot?.spaces || []).map((s) => <SidebarSpaceRow key={s.id} space={s} on={selected === s.id} />)}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function AgentsSection() {
  const spaces = useStore((s) => s.spaces);
  const panes = useStore((s) => s.panes);
  const focused = useStore((s) => s.ui.focusedPane);
  const chats = useChats((s) => s.chats);
  // Chats are local: file each under the local space with the same folder; the rest go last.
  const { groups, loose } = useMemo(() => {
    const used = new Set<string>();
    const groups = spaces.map((space) => {
      const own = space.machine && space.machine !== "local" ? [] : chats.filter((c) => sameDir(c.cwd, space.cwd));
      own.forEach((c) => used.add(c.id));
      // A plain shell is not an agent yet: it shows up once claude/codex/... runs in it (detected from the title).
      return { space, panes: sortedPanesOf(panes, space.id).filter((p) => p.kind !== "shell"), chats: own };
    }).filter((g) => g.panes.length || g.chats.length);
    return { groups, loose: chats.filter((c) => !used.has(c.id)) };
  }, [spaces, panes, chats]);
  return (
    <div className="sb-half">
      <div className="shead" style={{ height: 41 }}>
        <span>Agents</span>
        <button className="ibtn" title="Agent tree" aria-label="Agent tree" onClick={() => allActions.show("tree")}><Icon name="layers" /></button>
      </div>
      <div className="slist">
        {groups.map(({ space, panes: list, chats: own }) => (
          <Fragment key={space.id}>
            <div className="grp">{space.machine && space.machine !== "local" ? `${space.name} · ${space.machine}` : space.name}</div>
            {list.map((p) => <SidebarAgentRow key={p.id} pane={p} on={focused === p.id} />)}
            <ChatRowList chats={own} />
          </Fragment>
        ))}
        <ChatRowList chats={loose} />
        {!groups.length && !loose.length ? <div className="empty-hint">No agents yet. Run claude, codex… in a terminal.</div> : null}
      </div>
    </div>
  );
}

function NavRow({ view, icon, label, count }: { view: string; icon: IconName; label: string; count?: number }) {
  const on = useStore((s) => s.ui.view === view);
  return (
    <button className={"srow" + (on ? " on" : "")} onClick={() => allActions.show(view)}>
      <Icon name={icon} />
      <span className="grow">{label}</span>
      {count ? <span className="count">{count}</span> : null}
    </button>
  );
}

function InboxRow() {
  const count = useStore((s) => s.counts.blocked || s.counts.unread);
  return <NavRow view="inbox" icon="inbox" label="Inbox" count={count} />;
}

export function Sidebar() {
  const visible = useStore((s) => s.ui.sidebar);
  useEffect(() => { document.getElementById("sidebar")?.classList.toggle("collapsed", !visible); }, [visible]);
  return (
    <HostPortal id="sidebar">
      <div className="brand">
        <span className="logo" role="img" aria-label="Drover" /><span className="name">Drover</span>
        <button className="ibtn" aria-label="Jump to a terminal" title="Jump to a terminal (Ctrl+A /)" onClick={() => allActions.search()}><Icon name="search" /></button>
        <button className="ibtn" aria-label="Hide sidebar" title="Hide sidebar (Ctrl+A b)" onClick={() => allActions.toggleSidebar()}><Icon name="sidebar" /></button>
      </div>
      <SpacesSection />
      <AgentsSection />
      <div className="sfoot">
        <InboxRow />
        <NavRow view="machines" icon="server" label="Machines" />
        <NavRow view="settings" icon="gear" label="Settings" />
      </div>
    </HostPortal>
  );
}
