// Daemon events -> store + toasts (port of app.js::onEvent), and the connection bootstrap.
import { loadHistory } from "../chat/chat-actions";
import { useChats } from "../chat/chat-store";
import type { Chat, ChatOp } from "../chat/chat-types";
import { conn } from "./connection";
import { setServerIconSet } from "./file-icons";
import { maybeShowRestore } from "../overlays/restore-dialog";
import { takeUnexpectedSpaces } from "./new-workspace-notice";
import { getActions, setPrefix } from "./keys";
import type { Pane, RawState, StatusEvent } from "./protocol-types";
import { useStore } from "./store";
import { setServerTheme } from "./theme";
import { toast, type ToastTone } from "./toast-store";
import { startUpdateNotifier } from "./update-notifier";

export function routeEvent(name: string, data: unknown): void {
  const store = useStore.getState();
  if (name === "state" || name === "resync") {
    const raw = data as RawState;
    store.setRaw(raw);
    if (name === "resync") conn.reattachAll();
    useChats.getState().setChats((raw.chats as Chat[] | undefined) ?? []);
    if (name === "resync" && store.ui.chatId) void loadHistory(store.ui.chatId); // live ops may have been dropped
    setPrefix(raw.prefix);
    setServerTheme(raw.theme);
    setServerIconSet(raw.file_icons);
    const { ui, tabById } = useStore.getState();
    if (!ui.focusedPane) store.setUi({ focusedPane: (ui.tabId && tabById.get(ui.tabId)?.focused) || null });
    maybeShowRestore();
    for (const s of takeUnexpectedSpaces(raw)) {
      toast(`New workspace: ${s.name || s.cwd || s.id}`, `Opened for an agent in ${s.cwd || "a new folder"}${s.machine && s.machine !== "local" ? ` on ${s.machine}` : ""}.`,
        () => void getActions().renameSpace?.(s.id), null, { tone: "info", action: "Rename" });
    }
  } else if (name === "chats") {
    useChats.getState().setChats(data as Chat[]);
  } else if (name === "chat") {
    useChats.getState().apply(data as ChatOp);
  } else if (name === "pane") {
    store.upsertPane(data as Pane);
  } else if (name === "status") {
    onStatus(data as StatusEvent);
  } else if (name === "policy") {
    toast("An agent tried to answer a prompt", "Open the Inbox to allow or deny it.", () => getActions().show?.("inbox"),
      null, { tone: "blocked", action: "Review" });
  }
}

function onStatus(data: StatusEvent): void {
  const { pane } = data;
  const { ui } = useStore.getState();
  const visible = document.hasFocus() && ui.focusedPane === pane.id && ui.view === "workspace";
  if (visible || !(data.new === "blocked" || data.new === "done" || data.new === "exited")) return;
  const title = data.new === "blocked" ? `${pane.name} needs you` : data.new === "done" ? `${pane.name} finished` : `${pane.name} stopped`;
  toast(title, pane.title || pane.command || "", () => getActions().focusPane?.(pane.id),
    { type: "kind", kind: pane.kind || "" }, { tone: data.new as ToastTone, action: data.new === "blocked" ? "Answer" : "Open" });
}

/** Wire the connection to the store and open the socket. Call once at startup. */
export function startCore(): void {
  conn.onEvent(routeEvent);
  conn.onConnection = (up) => useStore.getState().setConnected(up);
  conn.connect();
  startUpdateNotifier();
}
