// Assembles every user action (buttons, palette, shortcuts) under the names keys.ts / the event router call.
import { registerActions, type Actions } from "../core/keys";
import { chatActions } from "../chat/chat-actions";
import { paneActions } from "./pane-actions";
import { paneLayoutActions } from "./pane-layout-actions";
import { tabSpaceActions } from "./tab-space-actions";
import { viewActions } from "./view-actions";

export const allActions = { ...viewActions, ...tabSpaceActions, ...paneActions, ...paneLayoutActions, ...chatActions };

export function installActions(): Actions {
  registerActions(allActions as Actions);
  return allActions as Actions;
}
