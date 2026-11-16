// App shell: every component renders into a static element of index.html via a portal.
import { useEffect } from "react";
import { useStore } from "./core/store";
import { ModalHost } from "./overlays/modal-host";
import { ConnBanner } from "./shell/conn-banner";
import { HostPortal } from "./shell/host-portal";
import { MobileNav } from "./shell/mobile-nav";
import { Sidebar } from "./shell/sidebar";
import { StatusBar } from "./shell/status-bar";
import { ContextMenu } from "./shell/context-menu";
import { UpdateOverlay } from "./shell/update-overlay";
import { Toasts } from "./shell/toasts";
import { Topbar } from "./shell/topbar";
import { viewFor } from "./views/view-registry";
import { Workspace } from "./workspace/workspace";

/** Shows #workspace or #altview for the current view and mirrors the phone "terminal open" flag on <body>. */
function ViewSwitch() {
  const view = useStore((s) => s.ui.view);
  const paneOpen = useStore((s) => !!s.ui.mobilePane);
  const workspace = view === "workspace";
  const AltView = viewFor(view);
  useEffect(() => {
    const ws = document.getElementById("workspace");
    const alt = document.getElementById("altview");
    if (ws) ws.hidden = !workspace;
    if (alt) alt.hidden = workspace;
  }, [workspace]);
  useEffect(() => { document.body.classList.toggle("pane-open", paneOpen); }, [paneOpen]);
  return (
    <>
      <Workspace />
      <HostPortal id="altview">{AltView ? <AltView /> : null}</HostPortal>
    </>
  );
}

export function App() {
  return (
    <>
      <Sidebar />
      <Topbar />
      <ViewSwitch />
      <StatusBar />
      <MobileNav />
      <Toasts />
      <ConnBanner />
      <UpdateOverlay />
      <ModalHost />
      <ContextMenu />
    </>
  );
}
