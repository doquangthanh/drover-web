// Phone-only additions to the top bar: terminal header (name, place, tab dots) and the Inbox title area.
// Hidden by CSS on wide screens and in the other phone screens.
import { allActions } from "../actions/build-actions";
import { useStore } from "../core/store";
import { Icon } from "../ui/atoms/icon";

export function MobilePaneHead() {
  const pane = useStore((s) => (s.ui.focusedPane ? s.paneById.get(s.ui.focusedPane) : undefined));
  const spaceId = useStore((s) => s.ui.spaceId);
  const tabId = useStore((s) => s.ui.tabId);
  const allTabs = useStore((s) => s.tabs);
  const spaceName = useStore((s) => (pane?.space_id ? s.spaceById.get(pane.space_id)?.name : "") || "");
  if (!pane) return null;
  const where = pane.machine && pane.machine !== "local" ? pane.machine : "This computer";
  const tabs = allTabs.filter((t) => t.space_id === spaceId);
  return (
    <div className="m-phead">
      <div className="m-pt trunc">{pane.name}</div>
      <div className="m-ps trunc">{`${spaceName} · ${where}`}</div>
      {tabs.length > 1 ? (
        <div className="m-dots" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} className={"m-dot" + (t.id === tabId ? " on" : "")} role="tab"
              aria-selected={t.id === tabId ? "true" : "false"} aria-label={`Tab ${t.name}`}
              onClick={() => allActions.selectTab(t.id)}><span /></button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MobileInboxHead() {
  return (
    <>
      <div className="m-ihead">
        <button className="m-ibtn" aria-label="Settings" onClick={() => allActions.show("settings")}><Icon name="gear" /></button>
      </div>
      <button className="m-isearch" onClick={() => allActions.search()}><Icon name="search" />Jump to a terminal…</button>
    </>
  );
}
