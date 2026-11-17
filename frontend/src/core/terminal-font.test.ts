import { describe, expect, it, vi } from "vitest";

vi.mock("./viewport", () => ({ isPhone: () => false }));
const tf = await import("./terminal-font");

describe("terminal font", () => {
  it("falls back to the browser monospace at 13 px when nothing is set", () => {
    expect(tf.terminalFontFamily()).toBe("ui-monospace, monospace");
    expect(tf.terminalFontSize()).toBe(13);
  });
  it("uses the system terminal's font from the daemon and tells listeners", () => {
    const seen = vi.fn();
    const off = tf.onTerminalFontChange(seen);
    tf.setServerTerminalFont({ family: "Ubuntu Mono", size: 17 });
    off();
    expect(seen).toHaveBeenCalledOnce();
    expect(tf.terminalFontFamily()).toBe('"Ubuntu Mono", ui-monospace, monospace');
    expect(tf.terminalFontSize()).toBe(17);
  });
  it("clamps silly sizes and strips quotes from the family", () => {
    tf.setServerTerminalFont({ family: 'Bad"Font', size: 400 });
    expect(tf.terminalFontFamily()).toBe('"BadFont", ui-monospace, monospace');
    expect(tf.terminalFontSize()).toBe(40);
  });
});
