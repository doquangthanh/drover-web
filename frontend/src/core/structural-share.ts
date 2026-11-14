// Reuse previous objects/arrays that are deep-equal to the new ones, so React.memo / selectors can skip unchanged entities.

export function replaceEqual<T>(prev: unknown, next: T): T {
  if (prev === next) return next;
  if (Array.isArray(prev) && Array.isArray(next)) {
    const out = next.map((item, i) => replaceEqual(prev[i], item));
    return (out.length === prev.length && out.every((v, i) => v === prev[i]) ? prev : out) as T;
  }
  if (isPlain(prev) && isPlain(next)) {
    const keys = Object.keys(next);
    const out: Record<string, unknown> = {};
    let same = keys.length === Object.keys(prev).length;
    for (const k of keys) {
      out[k] = replaceEqual(prev[k], next[k]);
      if (out[k] !== prev[k]) same = false;
    }
    return (same ? prev : out) as T;
  }
  return next;
}

function isPlain(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
