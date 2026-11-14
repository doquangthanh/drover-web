// Which stopped panes the restore dialog still has to ask about (pure).
export interface StoppedLike { id: string; kind?: string; name?: string; resume?: string; command?: string }

/** Stopped panes not asked about yet; empty when everything was already asked (once per pane per session). */
export function unaskedStopped<T extends { id: string }>(stopped: T[], asked: ReadonlySet<string>): T[] {
  return stopped.some((s) => !asked.has(s.id)) ? stopped : [];
}
