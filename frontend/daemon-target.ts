// Where the dev proxy forwards to: DROVER_DAEMON_URL, else the port in the running daemon's daemon.json.
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function stateDir(): string {
  if (process.env.DROVER_STATE_DIR) return process.env.DROVER_STATE_DIR;
  if (process.platform === "win32" && process.env.LOCALAPPDATA) return join(process.env.LOCALAPPDATA, "drover");
  if (process.platform === "darwin") return join(homedir(), "Library", "Application Support", "drover");
  return join(process.env.XDG_STATE_HOME || join(homedir(), ".local", "state"), "drover");
}

export interface DaemonTarget {
  url: string;
  token?: string;
}

export function daemonTarget(): DaemonTarget {
  const file = join(stateDir(), "daemon.json");
  let info: { port?: number; token?: string } = {};
  try {
    if (existsSync(file)) info = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    /* unreadable daemon.json: fall through to defaults */
  }
  const url = process.env.DROVER_DAEMON_URL || `http://127.0.0.1:${info.port ?? 8765}`;
  return { url, token: info.token };
}
