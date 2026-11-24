import { describe, expect, it } from "vitest";
import { aceThemeFor, modeFor } from "./editor-modes";

describe("modeFor", () => {
  it("maps extensions", () => {
    expect(modeFor("src/a.py")).toBe("python");
    expect(modeFor("web/App.TSX")).toBe("tsx");
    expect(modeFor("x/y/main.rs")).toBe("rust");
  });
  it("uses the last extension and the file name", () => {
    expect(modeFor("a.test.ts")).toBe("typescript");
    expect(modeFor("deploy/Dockerfile")).toBe("dockerfile");
  });
  it("falls back to text", () => {
    expect(modeFor("LICENSE")).toBe("text");
    expect(modeFor("a.unknownext")).toBe("text");
    expect(modeFor(".gitignore")).toBe("text");
  });
});

describe("aceThemeFor", () => {
  it("maps app themes and defaults to dark", () => {
    expect(aceThemeFor("light")).toBe("ace/theme/github");
    expect(aceThemeFor("midnight")).toBe("ace/theme/tomorrow_night_blue");
    expect(aceThemeFor("dracula")).toBe("ace/theme/dracula");
    expect(aceThemeFor("tokyo-night")).toBe("ace/theme/tokyo_night");
    expect(aceThemeFor("one-dark")).toBe("ace/theme/one_dark");
    expect(aceThemeFor("nope")).toBe("ace/theme/tomorrow_night");
  });
});
