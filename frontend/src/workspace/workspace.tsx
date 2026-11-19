// Content of #workspace: the selected tab's split layout (or only the focused pane when zoomed), or the welcome card.
// Recently shown tabs stay mounted underneath, hidden: switching space or tab back to one of them only flips its
// visibility. Their terminals keep their place in the page and their exact size, so nothing is re-parented, re-fitted
// or redrawn (re-attaching xterm made each switch slow in the WebKitGTK window).
import { useMemo, useRef } from "react";
import { useStore } from "../core/store";
import { HostPortal } from "../shell/host-portal";
import type { Node } from "./layout-tree";
import { LayoutNode } from "./split-node";
import { nextWarmTabs } from "./warm-tabs";
import { WelcomeCard } from "./welcome-card";

const STACK = { display: "grid", gridTemplate: "minmax(0, 1fr) / minmax(0, 1fr)", flex: 1, minWidth: 0, minHeight: 0 };

function TabLayer({ tabId, active }: { tabId: string; active: boolean }) {
  const tab = useStore((s) => s.tabById.get(tabId));
  const layout = tab?.layout as Node | null | undefined;
  const zoomPane = tab?.zoomed ? tab.focused : null;
  const node = useMemo<Node | null | undefined>(() => (zoomPane ? { pane: zoomPane } : layout), [zoomPane, layout]);
  if (!node) return null;
  // Every layer fills the same grid cell, so a hidden tab has exactly the size it will be shown at.
  return (
    <div className={"tab-layer" + (active ? " on" : "")} aria-hidden={!active || undefined}
      style={{ gridArea: "1 / 1", display: "flex", minWidth: 0, minHeight: 0,
        visibility: active ? "visible" : "hidden", pointerEvents: active ? "auto" : "none" }}>
      <LayoutNode node={node} path="" tabId={tabId} />
    </div>
  );
}

function TabLayers() {
  const tabId = useStore((s) => s.ui.tabId);
  const tabById = useStore((s) => s.tabById);
  const warm = useRef<string[]>([]);
  warm.current = nextWarmTabs(warm.current, tabId, new Set(tabById.keys()));
  const current = tabId ? tabById.get(tabId) : undefined;
  if (!current || !(current.layout || current.zoomed)) return <WelcomeCard />;
  return (
    <div style={STACK}>
      {/* Stable order (by id), so switching only changes `active` and React moves nothing. */}
      {[...warm.current].sort().map((id) => <TabLayer key={id} tabId={id} active={id === tabId} />)}
    </div>
  );
}

export function Workspace() {
  return <HostPortal id="workspace"><TabLayers /></HostPortal>;
}
