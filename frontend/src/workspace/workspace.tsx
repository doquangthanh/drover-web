// Content of #workspace: the selected tab's split layout (or only the focused pane when zoomed), or the welcome card.
import { useMemo } from "react";
import { useStore } from "../core/store";
import { HostPortal } from "../shell/host-portal";
import type { Node } from "./layout-tree";
import { LayoutNode } from "./split-node";
import { WelcomeCard } from "./welcome-card";

function TabLayout() {
  const tab = useStore((s) => (s.ui.tabId ? s.tabById.get(s.ui.tabId) : undefined));
  const layout = tab?.layout as Node | null | undefined;
  const zoomPane = tab?.zoomed ? tab.focused : null;
  const node = useMemo<Node | null | undefined>(() => (zoomPane ? { pane: zoomPane } : layout), [zoomPane, layout]);
  if (!tab || !node) return <WelcomeCard />;
  return <LayoutNode key={tab.id} node={node} path="" tabId={tab.id} />;
}

export function Workspace() {
  return <HostPortal id="workspace"><TabLayout /></HostPortal>;
}
