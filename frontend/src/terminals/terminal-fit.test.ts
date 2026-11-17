import { describe, expect, it, vi } from "vitest";

vi.mock("../core/connection", () => ({ conn: {} }));
vi.mock("../core/viewport", () => ({ isPhone: () => false }));
const { useWebglRenderer } = await import("./terminal-fit");

const CHROME = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const QT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/6.140.0 Chrome/140.0.0.0 Safari/537.36";

describe("terminal renderer", () => {
  it("uses WebGL in a desktop browser", () => {
    expect(useWebglRenderer(CHROME, false)).toBe(true);
  });
  it("keeps the DOM renderer in the Linux desktop window, where WebGL draws letter-spaced text", () => {
    expect(useWebglRenderer(QT, false)).toBe(false);
  });
  it("keeps the DOM renderer on touch screens", () => {
    expect(useWebglRenderer(CHROME, true)).toBe(false);
  });
});
