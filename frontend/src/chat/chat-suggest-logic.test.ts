import { describe, expect, it } from "vitest";
import { activeToken, applySuggestion, filterCommands, stepIndex } from "./chat-suggest-logic";

describe("activeToken", () => {
  it("finds an @file anywhere after a space or at the start", () => {
    expect(activeToken("look at @src/ap", 15)).toEqual({ kind: "file", query: "src/ap", start: 8, end: 15 });
    expect(activeToken("@r", 2)).toEqual({ kind: "file", query: "r", start: 0, end: 2 });
    expect(activeToken("see @", 5)).toMatchObject({ kind: "file", query: "" });
  });
  it("does not treat an email or a finished mention as a token", () => {
    expect(activeToken("mail me@home", 12)).toBeNull();
    expect(activeToken("@a.ts and more", 14)).toBeNull();
  });
  it("finds a /command only at the start of the message", () => {
    expect(activeToken("/com", 4)).toEqual({ kind: "command", query: "com", start: 0, end: 4 });
    expect(activeToken("  /m", 4)).toMatchObject({ kind: "command", query: "m", start: 2 });
    expect(activeToken("not /compact", 12)).toBeNull();
    expect(activeToken("/compact now", 12)).toBeNull(); // arguments are being typed
    expect(activeToken("path/to", 7)).toBeNull();
  });
  it("only looks before the caret", () => {
    expect(activeToken("@ab cd", 3)).toMatchObject({ query: "ab" });
    expect(activeToken("hello @ab", 2)).toBeNull();
  });
});

describe("applySuggestion", () => {
  it("replaces the token and leaves the caret after the inserted text", () => {
    const text = "look at @src/ap now";
    const token = activeToken(text, 15)!;
    expect(applySuggestion(text, token, "@src/app/page.tsx")).toEqual({ text: "look at @src/app/page.tsx now", caret: 26 });
  });
  it("works at the end of the text and for commands", () => {
    expect(applySuggestion("/co", activeToken("/co", 3)!, "/compact")).toEqual({ text: "/compact ", caret: 9 });
  });
});

describe("filterCommands", () => {
  const cmds = [
    { name: "compact", description: "Summarize the chat", hint: "" },
    { name: "ck:fix", description: "Fix bugs", hint: "[issue]" },
    { name: "cost", description: "Show spend", hint: "" },
    { name: "review", description: "Review code and compact diffs", hint: "" },
  ];
  it("ranks prefix, then namespace match, then contains, then description", () => {
    expect(filterCommands(cmds, "co").map((c) => c.name)).toEqual(["cost", "compact", "review"]);
    expect(filterCommands(cmds, "fix").map((c) => c.name)).toEqual(["ck:fix"]);
    expect(filterCommands(cmds, "spend").map((c) => c.name)).toEqual(["cost"]);
  });
  it("empty query lists the first ones, limit applies, nothing matches nothing", () => {
    expect(filterCommands(cmds, "", 2)).toHaveLength(2);
    expect(filterCommands(cmds, "zzz")).toEqual([]);
  });
});

describe("stepIndex", () => {
  it("wraps around both ends and copes with an empty list", () => {
    expect(stepIndex(0, -1, 3)).toBe(2);
    expect(stepIndex(2, 1, 3)).toBe(0);
    expect(stepIndex(0, 1, 0)).toBe(0);
  });
});
