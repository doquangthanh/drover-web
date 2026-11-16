// Phone navigation: bottom tab bar, "new agent" button and a More sheet. All hidden by CSS on wide screens.
// body[data-m] is "home" (agent list), "pane" (one terminal, full screen) or "view" (Inbox, Files, Changes, ...).
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { allActions } from "../actions/build-actions";
import { getActions } from "../core/keys";
import { useStore } from "../core/store";
import { closeModal, openModal } from "../overlays/modal-store";
import { Icon, type IconName } from "../ui/atoms/icon";
import { mobileMode } from "./shell-logic";

const TABS: [string, IconName, string][] = [
  ["home", "layers", "Agents"], ["inbox", "inbox", "Inbox"], ["files", "folder", "Files"], ["changes", "branch", "Changes"],
  ["more", "more", "More"],
];
const MORE: [string, IconName, string][] = [
  ["tree", "tree", "Agent tree"], ["machines", "server", "Machines"], ["settings", "gear", "Settings"],
  ["server", "server", "drover-server"], ["search", "search", "Jump to a terminal"], ["palette", "keyboard", "Command palette"],
  ["help", "keyboard", "Keyboard shortcuts"],
];
const VIEWS_IN_MORE = new Set(["tree", "machines", "settings", "server"]);

function openMore(): void {
  openModal({
    title: "More", size: "sheet",
    body: (
      <div className="sheet-list">
        {MORE.map(([action, icon, label]) => (
          <button key={action} className="sheet-row" onClick={() => {
            closeModal();
            setTimeout(() => (VIEWS_IN_MORE.has(action) ? allActions.show(action) : getActions()[action]?.({})), 0);
          }}>
            <Icon name={icon} /><span className="grow">{label}</span>
          </button>
        ))}
      </div>
    ),
  });
}

function onTab(tab: string): void {
  if (tab === "home") { allActions.show("workspace"); allActions.mobileBack(); }
  else if (tab === "more") openMore();
  else allActions.show(tab);
}

export function MobileNav() {
  const view = useStore((s) => s.ui.view);
  const mobilePane = useStore((s) => s.ui.mobilePane);
  const badge = useStore((s) => s.counts.blocked + s.counts.unread);
  const mode = mobileMode(view, mobilePane);
  const active = mode === "home" ? "home" : VIEWS_IN_MORE.has(view) ? "more" : view;

  useEffect(() => { document.body.dataset.m = mode; document.body.dataset.view = view; }, [mode, view]);

  // The on-screen keyboard shrinks the visual viewport: size the app to it so the key bar stays above the keyboard.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const fit = () => document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
    vv.addEventListener("resize", fit);
    fit();
    return () => vv.removeEventListener("resize", fit);
  }, []);

  return createPortal(
    <>
      <nav id="bottomnav" aria-label="Main">
        {TABS.map(([id, icon, label]) => (
          <button key={id} data-tab={id} className={"mt" + (id === active ? " on" : "")} aria-label={label}
            aria-current={id === active ? "page" : undefined} onClick={() => onTab(id)}>
            <span className="mt-ic"><Icon name={icon} />{id === "inbox" && badge ? <span className="count">{badge}</span> : null}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <button id="fab" aria-label="New terminal" onClick={() => allActions.newAgent()}><Icon name="plus" />New terminal</button>
    </>,
    document.body,
  );
}
