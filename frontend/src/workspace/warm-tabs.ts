// Which tabs stay mounted (hidden) under the shown one, so switching back is instant (pure).

/** Tabs kept mounted. Each keeps its terminals' GPU contexts, and WebKit allows only a few dozen at once. */
export const WARM_TABS = 6;

/** Most recent first: `current` moves to the front, closed tabs drop out, at most `limit` stay. */
export function nextWarmTabs(prev: string[], current: string | null, live: Set<string>, limit = WARM_TABS): string[] {
  const kept = prev.filter((id) => id !== current && live.has(id));
  return (current && live.has(current) ? [current, ...kept] : kept).slice(0, limit);
}
