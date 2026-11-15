// Ask the daemon (which asks GitHub) for a newer release soon after start and twice a day; toast once per version.
import { getActions } from "./keys";
import { conn } from "./connection";
import { toast } from "./toast-store";
import { useSettingsNav } from "../views/settings-nav-store";

const FIRST_CHECK_MS = 15_000;
const RECHECK_MS = 12 * 60 * 60 * 1000;
let started = false;
let announced = "";

interface UpdateInfo { latest: string; available: boolean; installable: boolean }

async function check(): Promise<void> {
  try {
    const info = await conn.rpc<UpdateInfo>("update.check", {});
    if (!info.available || info.latest === announced) return;
    announced = info.latest;
    const sub = info.installable ? "Click to update from Settings → Updates" : "See Settings → Updates";
    toast(`Drover v${info.latest} is available`, sub, () => {
      useSettingsNav.setState({ section: "updates" });
      getActions().settings?.();
    });
  } catch {
    // Offline or GitHub rate limit: stay quiet, try again later.
  }
}

/** Start the background update check (idempotent). */
export function startUpdateNotifier(): void {
  if (started) return;
  started = true;
  setTimeout(check, FIRST_CHECK_MS);
  setInterval(check, RECHECK_MS);
}
