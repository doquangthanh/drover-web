// #conn-banner is a static element in index.html; show it while the socket is down.
import { useEffect } from "react";
import { useStore } from "../core/store";

export function ConnBanner() {
  const connected = useStore((s) => s.connected);
  useEffect(() => {
    const el = document.getElementById("conn-banner");
    if (el) el.hidden = connected;
  }, [connected]);
  return null;
}
