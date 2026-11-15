// Left sidebar: one tree of workspaces (every machine in the same list), each with its agents under it; chats; nav footer.
import { memo, useCallback, useEffect, useMemo, type MouseEvent } from "react";
import { allActions } from "../actions/build-actions";
import { useStore } from "../core/store";
import { useCollapsedWorkspaces } from "../core/collapsed-workspaces-store";
import { openContextMenu } from "../core/context-menu-store";
import { Icon, type IconName } from "../ui/atoms/icon";
import { ChatRows } from "../chat/chat-sidebar";
import { SidebarAgentRow } from "./sidebar-agent-row";
import { SidebarSpaceRow } from "./sidebar-space-row";
import { sortedPanesOf } from "./shell-logic";
import { HostPortal } from "./host-portal";
import type { Space } from "../core/protocol-types";

/** "+" opens a folder on this computer; with machines connected it first asks where. */
function newWorkspace(e: MouseEvent) {
  const remote = (useStore.getState().raw.machines || []).filter((m) => m.status === "connected");
  if (!remote.length) { void allActions.newSpace(null); return; }
  openContextMenu(e, [
    { label: "On this computer…", run: () => void allActions.newSpace(null) },
    ...remote.map((m) => ({ label: `On ${m.alias}…`, run: () => void allActions.newSpace(m.alias) })),
  ]);
}

/** A workspace row and, unless collapsed, its agents (most urgent first). */
const WorkspaceGroup = memo(function WorkspaceGroup({ space, selected, collapsed }: { space: Space; selected: boolean; collapsed: boolean }) {
  const panes = useStore((s) => s.panes);
  const focused = useStore((s) => s.ui.focusedPane);
  const list = useMemo(() => sortedPanesOf(panes, space.id), [panes, space.id]);
  const toggle = useCallback(() => useCollapsedWorkspaces.getState().toggle(space.id), [space.id]);
  // The row is highlighted only when no agent row under it can carry the selection.
  return (
    <div className="wsgroup" role="group" aria-label={space.name}>
      <SidebarSpaceRow space={space} on={selected && (collapsed || !list.length)} collapsed={collapsed} empty={!list.length} onToggle={toggle} />
      {collapsed ? null : list.map((p) => <SidebarAgentRow key={p.id} pane={p} on={focused === p.id} />)}
    </div>
  );
});

function WorkspacesSection() {
  const spaces = useStore((s) => s.spaces);
  const selected = useStore((s) => s.ui.spaceId);
  const collapsed = useCollapsedWorkspaces((s) => s.collapsed);
  return (
    <div className="sb-half">
      <div className="shead">
        <span>Workspaces</span>
        <button className="ibtn" title="Open a folder as a workspace (Ctrl+A S)" aria-label="Open a folder as a workspace" onClick={newWorkspace}>
          <Icon name="plus" />
        </button>
      </div>
      <div className="slist">
        {spaces.map((s) => <WorkspaceGroup key={s.id} space={s} selected={selected === s.id} collapsed={collapsed.has(s.id)} />)}
        {!spaces.length ? <div className="empty-hint">Open a folder to start: press + or Ctrl+A S.</div> : null}
        <ChatRows />
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
        <button className="ibtn" aria-label="Agent tree" title="Agent tree (Ctrl+A o)" onClick={() => allActions.show("tree")}><Icon name="layers" /></button>
        <button className="ibtn" aria-label="Hide sidebar" title="Hide sidebar (Ctrl+A b)" onClick={() => allActions.toggleSidebar()}><Icon name="sidebar" /></button>
      </div>
      <WorkspacesSection />
      <div className="sfoot">
        <InboxRow />
        <NavRow view="machines" icon="server" label="Machines" />
        <NavRow view="settings" icon="gear" label="Settings" />
      </div>
    </HostPortal>
  );
}
