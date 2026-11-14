import { describe, expect, it } from "vitest";
import { isMouseTrackingOnly } from "./mouse-tracking-filter";

describe("isMouseTrackingOnly", () => {
  it("drops sequences that only enable mouse reporting", () => {
    expect(isMouseTrackingOnly([1000])).toBe(true);
    expect(isMouseTrackingOnly([1002, 1003])).toBe(true);
  });
  it("keeps everything else", () => {
    expect(isMouseTrackingOnly([1049])).toBe(false);     // alternate screen
    expect(isMouseTrackingOnly([2004])).toBe(false);     // bracketed paste
    expect(isMouseTrackingOnly([1006])).toBe(false);     // SGR encoding alone
    expect(isMouseTrackingOnly([1000, 2004])).toBe(false); // mixed: do not lose the other mode
    expect(isMouseTrackingOnly([])).toBe(false);
  });
});
