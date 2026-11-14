// #topbar: workspace tabs, or the view bar for full-page views, plus the phone-only heads.
import { useEffect } from "react";
import { useStore } from "../core/store";
import { HostPortal } from "./host-portal";
import { MobileInboxHead, MobilePaneHead } from "./mobile-topbar";
import { TopbarTabs } from "./topbar-tabs";
import { TopbarViewBar } from "./topbar-view-bar";

export function Topbar() {
  const view = useStore((s) => s.ui.view);
  const workspace = view === "workspace";
  useEffect(() => { document.getElementById("topbar")?.classList.toggle("vbar", !workspace); }, [workspace]);
  return (
    <HostPortal id="topbar">
      {workspace ? <TopbarTabs /> : <TopbarViewBar view={view} />}
      {workspace ? <MobilePaneHead /> : view === "inbox" ? <MobileInboxHead /> : null}
    </HostPortal>
  );
}
