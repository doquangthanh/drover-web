// Desktop/tablet workspace top bar: space tabs, new agent, split, view shortcuts (+ phone back/files/more buttons).
import { memo, useEffect, useMemo } from "react";
import { allActions } from "../actions/build-actions";
import type { Pane, Tab } from "../core/protocol-types";
import { useRenaming } from "../core/inline-rename-store";
import { useStore } from "../core/store";
import { InlineNameInput } from "./inline-name-input";
import { Icon } from "../ui/atoms/icon";
import { KindIcon } from "../ui/atoms/kind-icon";
import { StateMark } from "../ui/atoms/state-mark";

const TopTab = memo(function TopTab({ tab, on, focused }: { tab: Tab; on: boolean; focused: Pane | undefined }) {
  const key = `tab:${tab.id}`;
  const renaming = useRenaming((s) => s.key === key);
  return (
    <div data-key={key} className={"tab" + (on ? " on" : "")} role="tab" tabIndex={0}
      onClick={() => allActions.selectTab(tab.id)} onDoubleClick={() => void allActions.renameTab(tab.id)}
      onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }} // no browser autoscroll on middle click
      onAuxClick={(e) => { if (e.button === 1) void allActions.closeTab(tab.id); }}
      onContextMenu={(e) => { e.preventDefault(); void allActions.renameTab(tab.id); }}>
      {focused ? <KindIcon kind={focused.kind} /> : null}
      {renaming ? <InlineNameInput value={tab.name ?? ""} onCommit={(n) => allActions.setTabName(tab.id, n)} /> : tab.name}
      {focused ? <StateMark pane={focused} /> : null}
      <button className="x" aria-label={`Close tab ${tab.name}`}
        onClick={(e) => { e.stopPropagation(); void allActions.closeTab(tab.id); }}>×</button>
    </div>
  );
});

export function TopbarTabs() {
  const spaceId = useStore((s) => s.ui.spaceId);
  const tabId = useStore((s) => s.ui.tabId);
  const sidebar = useStore((s) => s.ui.sidebar);
  const allTabs = useStore((s) => s.tabs);
  const panes = useStore((s) => s.panes);
  const paneById = useStore((s) => s.paneById);
  const zoomed = useStore((s) => !!(s.ui.tabId && s.tabById.get(s.ui.tabId)?.zoomed));
  const tabs = useMemo(() => allTabs.filter((t) => t.space_id === spaceId), [allTabs, spaceId]);
  useEffect(() => { // mouse wheel over the tab bar scrolls it sideways when the tabs overflow
    const bar = document.getElementById("topbar");
    if (!bar) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaX || bar.scrollWidth <= bar.clientWidth) return;
      bar.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    bar.addEventListener("wheel", onWheel, { passive: false });
    return () => bar.removeEventListener("wheel", onWheel);
  }, []);
  return (
    <>
      <button className="pb mobile-back mobile-only" onClick={() => allActions.mobileBack()} aria-label="Back"><Icon name="back" /></button>
      {sidebar ? null : <button className="pb" aria-label="Show sidebar" onClick={() => allActions.toggleSidebar()}><Icon name="sidebar" /></button>}
      {tabs.map((t) => (
        <TopTab key={t.id} tab={t} on={t.id === tabId}
          focused={(t.focused ? paneById.get(t.focused) : undefined) || panes.find((p) => p.tab_id === t.id)} />
      ))}
      <button className="pb" aria-label="New terminal" title="New terminal (Ctrl+A c)" onClick={() => allActions.newAgent()}>+</button>
      <span className="grow" />
      {zoomed ? <span className="zoomed desk">Zoomed · Ctrl+K Ctrl+M</span> : null}
      <button className="pb wide" onClick={() => allActions.splitRight()} title="Split right (Ctrl+A %)"><Icon name="split" /></button>
      <button className="pb wide" onClick={() => allActions.show("tree")}>Agents</button>
      <button className="pb wide" onClick={() => allActions.show("files")}>Files</button>
      <button className="pb wide" onClick={() => allActions.show("changes")}>Changes</button>
      <button className="pb mobile-only" aria-label="Files" onClick={() => allActions.show("files")}><Icon name="folder" /></button>
      <button className="pb mobile-only" aria-label="All commands" onClick={() => allActions.palette()}><Icon name="more" /></button>
    </>
  );
}
