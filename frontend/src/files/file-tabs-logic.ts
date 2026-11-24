// Which tab opens when one closes (pure, unit-tested).
export const withTab = (tabs: string[] | undefined, path: string): string[] => {
  const list = tabs ?? [];
  return list.includes(path) ? list : [...list, path];
};

/** Close `path`. If it was the selected tab the neighbour to its left (else right) is selected; `file` null = no tab left. */
export function closeTab(tabs: string[], path: string, active: string | null): { tabs: string[]; file: string | null } {
  const i = tabs.indexOf(path);
  if (i < 0) return { tabs, file: active };
  const rest = tabs.filter((p) => p !== path);
  if (path !== active) return { tabs: rest, file: active };
  return { tabs: rest, file: rest[i - 1] ?? rest[i] ?? null };
}
