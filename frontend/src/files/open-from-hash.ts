// Open a file named by a `#files?space=..&file=..` link (parsing: file-hash.ts) once its space is known.
import { useStore } from "../core/store";
import type { FileHash } from "./file-hash";
import { openFileAt } from "./open-from-terminal";

/** Open the file once the space has arrived from the daemon (the first state event comes after the page loads). */
export function openFileFromHash(target: FileHash, timeoutMs = 15000): void {
  const tryOpen = (): boolean => {
    const space = useStore.getState().spaceById.get(target.space);
    if (!space) return false;
    openFileAt(space, target.file, target.line, target.col);
    return true;
  };
  if (tryOpen()) return;
  const stop = useStore.subscribe(() => { if (tryOpen()) stop(); });
  setTimeout(stop, timeoutMs);
}
