// Native folder dialog exposed by the desktop window (this computer only).
export function hasNativePicker(): boolean {
  return typeof window.pywebview?.api?.pick_folder === "function";
}

/** Path chosen in the native dialog, or null when cancelled. Throws if the bridge fails. */
export async function pickNativeFolder(start: string): Promise<string | null> {
  return (await window.pywebview!.api!.pick_folder!(start || "")) ?? null;
}
