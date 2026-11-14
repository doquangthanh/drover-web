import { createRoot } from "react-dom/client";
import { installActions } from "./actions/build-actions";
import { App } from "./app";
import { startCore } from "./core/event-router";
import { installGlobalKeys } from "./core/keys";
import "./core/theme";
import "./styles";

// Each feature area registers itself (views, overlays, terminals) from its own register.ts.
import.meta.glob("./**/register.ts", { eager: true });

// App portals into the static shell elements of index.html; this host node only anchors the React root.
const host = document.createElement("div");
document.body.appendChild(host);

installActions();
createRoot(host).render(<App />);

installGlobalKeys();
startCore();
