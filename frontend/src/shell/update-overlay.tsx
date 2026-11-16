// Full-screen "updating" cover from the moment an update is installed until the page reloads on the new server.
import { useStore } from "../core/store";

export function UpdateOverlay() {
  const updating = useStore((s) => s.updating);
  if (!updating) return null;
  return (
    <div className="update-overlay" role="alert" aria-live="polite">
      <span className="update-spinner" />
      <div className="update-title">Updating Drover…</div>
      <div className="update-sub">The server is restarting. This page reloads by itself.</div>
    </div>
  );
}
