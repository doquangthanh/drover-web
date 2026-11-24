import { createRoot } from "react-dom/client";
import { allActions, installActions } from "./actions/build-actions";
import { App } from "./app";
import { startCore } from "./core/event-router";
import { installGlobalKeys } from "./core/keys";
import { parseFileHash } from "./files/file-hash";
import { openFileFromHash } from "./files/open-from-hash";
import "./core/theme";
import "./styles";

// Each feature area registers itself (views, overlays, terminals) from its own register.ts.
import.meta.glob("./**/register.ts", { eager: true });

// App portals into the static shell elements of index.html; this host node only anchors the React root.
const host = document.createElement("div");
document.body.appendChild(host);

installActions();
createRoot(host).render(<App />);

// `#files`, `#changes`, ...: open that view (the native desktop app links here for views it does not have yet).
const OPENABLE = ["inbox", "changes", "files", "machines", "settings", "server", "tree"];
const wanted = location.hash.slice(1);
const fileLink = parseFileHash(location.hash); // #files?space=..&file=..&line=..
if (fileLink) {
  history.replaceState(null, "", location.pathname);
  openFileFromHash(fileLink);
} else if (OPENABLE.includes(wanted)) {
  history.replaceState(null, "", location.pathname);
  queueMicrotask(() => allActions.show(wanted));
}

installGlobalKeys();
startCore();
