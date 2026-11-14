/** Relative age of a unix timestamp (seconds): "<1m", "30s", "5m", "2h", "3d". */
export function ago(ts: number, nowMs: number = Date.now()): string {
  const s = Math.max(0, Math.floor(nowMs / 1000 - ts));
  if (s < 60) return s < 5 ? "<1m" : `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function shortPath(path: string | null | undefined): string {
  if (!path) return "";
  const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts.length > 3 ? "…/" + parts.slice(-2).join("/") : path;
}
