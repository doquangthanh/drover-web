// TUIs such as Claude Code switch the terminal into mouse-reporting mode (DECSET 9/1000/1001/1002/1003). While that is on,
// dragging sends mouse events to the program instead of selecting text, so nothing can be highlighted or copied.
// herd ignores those requests: the mouse always selects text. (SGR encoding 1006 is harmless on its own and passes through.)
const MOUSE_TRACKING_MODES = new Set([9, 1000, 1001, 1002, 1003]);

/** True when a `CSI ? … h` sequence only turns mouse reporting on, so it can be dropped without losing other modes. */
export function isMouseTrackingOnly(params: readonly (number | number[])[]): boolean {
  return params.length > 0 && params.every((p) => typeof p === "number" && MOUSE_TRACKING_MODES.has(p));
}
