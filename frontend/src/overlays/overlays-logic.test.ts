import { describe, expect, it } from "vitest";
import { baseName, filterEntries, folderAge, recentFolders, splitCrumb } from "./folder-picker-logic";
import { AGENTS, buildCommand, cliPreview, createParams, worktreePath, worktreeSlug } from "./new-agent-logic";
import { BASE_COMMANDS, buildCommands, filterCommands, splitKeys } from "./palette-commands";
import { unaskedStopped } from "./restore-logic";
import { matchAgents, matchSpaces, splitHighlight } from "./search-logic";
import { shortcutChips } from "./shortcuts-logic";
import { clampSelection, moveSelection } from "./use-list-keyboard-nav";
import { SHORTCUTS } from "../core/keys";

describe("palette", () => {
  const cmds = buildCommands([["dark", "Dark"], ["light", "Light"]], [["material", "Material", "x"]]);
  it("appends theme and icon-set commands", () => {
    expect(cmds.length).toBe(BASE_COMMANDS.length + 3);
    expect(cmds.find((c) => c[2] === "theme:light")?.[1]).toBe("Theme: Light");
    expect(cmds.find((c) => c[2] === "icons:material")?.[1]).toBe("File icons: Material");
  });
  it("filters on label or group, case-insensitively; empty keeps all", () => {
    expect(filterCommands(cmds, "  ")).toHaveLength(cmds.length);
    expect(filterCommands(cmds, "SPLIT").map((c) => c[2])).toEqual(["splitRight", "splitDown"]);
    expect(filterCommands(cmds, "theme").every((c) => c[0] === "Theme" || c[1].toLowerCase().includes("theme"))).toBe(true);
    expect(filterCommands(cmds, "zzzz")).toEqual([]);
  });
  it("every shortcut-bound action has a command with the same key", () => {
    for (const [, items] of SHORTCUTS) for (const [key, , action] of items) {
      const c = BASE_COMMANDS.find((x) => x[2] === action);
      if (c && c[3] && key.length === 1) expect(c[3].endsWith(` ${key}`)).toBe(true);
    }
  });
  it("splits key chips", () => {
    expect(splitKeys("Ctrl B c")).toEqual(["Ctrl B", "c"]);
    expect(splitKeys("")).toEqual([]);
  });
});

describe("list navigation", () => {
  it("clamps without wrapping", () => {
    expect(moveSelection(0, "ArrowUp", 3)).toBe(0);
    expect(moveSelection(2, "ArrowDown", 3)).toBe(2);
    expect(moveSelection(1, "ArrowDown", 3)).toBe(2);
    expect(moveSelection(0, "a", 3)).toBeNull();
    expect(clampSelection(5, 2)).toBe(1);
    expect(clampSelection(5, 0)).toBe(0);
  });
});

describe("terminal search", () => {
  const panes = [
    { id: "%1", name: "Alpha", kind: "claude", state: "idle", cwd: "/w/app" },
    { id: "%2", name: "beta", kind: "shell", state: "idle", cwd: "/w/other" },
  ];
  it("matches agents by name, kind or cwd; empty query lists all", () => {
    expect(matchAgents(panes, "")).toHaveLength(2);
    expect(matchAgents(panes, "alp").map((p) => p.id)).toEqual(["%1"]);
    expect(matchAgents(panes, "shell").map((p) => p.id)).toEqual(["%2"]);
    expect(matchAgents(panes, "/other").map((p) => p.id)).toEqual(["%2"]);
  });
  it("caps agents at 12", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: `%${i}`, name: `n${i}`, kind: "shell", state: "idle" }));
    expect(matchAgents(many, "")).toHaveLength(12);
  });
  it("lists spaces only when a query is typed", () => {
    const spaces = [{ id: "s1", name: "herd", cwd: "/w/herd" }];
    expect(matchSpaces(spaces, "")).toEqual([]);
    expect(matchSpaces(spaces, "HER")).toHaveLength(1);
    expect(matchSpaces(spaces, "/w/")).toHaveLength(1);
  });
  it("splits highlight", () => {
    expect(splitHighlight("Hello World", "lo w")).toEqual(["Hel", "lo W", "orld"]);
    expect(splitHighlight("abc", "")).toBeNull();
    expect(splitHighlight("abc", "x")).toBeNull();
  });
});

describe("folder picker", () => {
  it("baseName / crumb", () => {
    expect(baseName("/a/b/")).toBe("b");
    expect(baseName("C:\\x\\y")).toBe("y");
    expect(splitCrumb("/a/b")).toEqual(["/a/ ", "b"]);
    expect(splitCrumb("/")).toEqual(["/", ""]);
  });
  it("folderAge buckets", () => {
    const now = 1_000_000 * 1000;
    const ago = (days: number) => folderAge(1_000_000 - days * 86400 - 5, now);
    expect(ago(0)).toBe("today");
    expect(ago(1)).toBe("yesterday");
    expect(ago(3)).toBe("3 days ago");
    expect(ago(8)).toBe("1 week ago");
    expect(ago(15)).toBe("2 weeks ago");
    expect(ago(31)).toBe("1 month ago");
    expect(ago(65)).toBe("2 months ago");
  });
  it("filters entries and dedupes recent folders per machine", () => {
    expect(filterEntries([{ name: "Src", path: "/Src" }, { name: "docs", path: "/docs" }], "sr").map((e) => e.name)).toEqual(["Src"]);
    const spaces = [{ id: "1", cwd: "/a" }, { id: "2", cwd: "/a" }, { id: "3", cwd: "/r", machine: "vps" }, { id: "4", cwd: "/l", machine: "local" }];
    expect(recentFolders(spaces, null)).toEqual(["/a", "/l"]);
    expect(recentFolders(spaces, "vps")).toEqual(["/r"]);
  });
});

describe("new agent", () => {
  it("builds commands", () => {
    expect(buildCommand("claude", "", " --resume ")).toBe("claude --resume");
    expect(buildCommand("shell", "", "")).toBe("");
    expect(buildCommand("custom", " make dev ", "-j4")).toBe("make dev -j4");
    expect(AGENTS.map((a) => a[0])).toContain("opencode");
  });
  it("slugs and worktree path", () => {
    expect(worktreeSlug("Discount Codes!", "claude")).toBe("discount-codes");
    expect(worktreeSlug("  ", "claude")).toBe("claude");
    expect(worktreeSlug("!!!", "x")).toBe("task");
    expect(worktreePath("/w/app/", "t")).toBe("/w/app-wt/t");
    expect(worktreePath(undefined, "t")).toBe("");
  });
  it("cli preview", () => {
    expect(cliPreview(null, false, "")).toBe("hd run -- (shell)");
    expect(cliPreview("vps", true, "claude")).toBe("hd run --on vps --worktree <task> -- claude");
  });
  it("create params: machine, worktree task, split placement", () => {
    const base = { command: "claude", cwd: " /w ", name: " ", kind: "claude", machine: null, worktree: false, place: "tab" as const };
    expect(createParams(base)).toEqual({ command: "claude", cwd: "/w", name: "" });
    expect(createParams({ ...base, worktree: true, now: 123456 }).worktree).toEqual({ task: "claude-3456" });
    expect(createParams({ ...base, name: "fix", worktree: true }).worktree).toEqual({ task: "fix" });
    const focused = { id: "%3", tab_id: "t1" };
    expect(createParams({ ...base, place: "split", focused })).toMatchObject({ tab_id: "t1", split_from: "%3" });
    expect(createParams({ ...base, place: "split", focused, machine: "vps" })).not.toHaveProperty("split_from"); // other machine
    expect(createParams({ ...base, place: "background", focused })).not.toHaveProperty("split_from");
  });
});

describe("shortcuts sheet", () => {
  it("renders ranges, arrows, plain keys", () => {
    expect(shortcutChips("1", "Go to tab 1–9")).toEqual({ text: "Go to tab", keys: [
      { text: "1", chip: true }, { text: "–", chip: false }, { text: "9", chip: true }] });
    expect(shortcutChips("a", "Answer prompt (then 1–3)").keys.map((k) => k.text)).toEqual(["a", "1", "–", "3"]);
    expect(shortcutChips("ArrowLeft", "Focus left").keys).toEqual([{ text: "←", chip: true }]);
    expect(shortcutChips("z", "Zoom")).toEqual({ text: "Zoom", keys: [{ text: "z", chip: true }] });
  });
});

describe("restore dialog", () => {
  it("asks only when some stopped pane is new", () => {
    const stopped = [{ id: "a" }, { id: "b" }];
    expect(unaskedStopped(stopped, new Set())).toBe(stopped);
    expect(unaskedStopped(stopped, new Set(["a"]))).toBe(stopped);
    expect(unaskedStopped(stopped, new Set(["a", "b"]))).toEqual([]);
    expect(unaskedStopped([], new Set())).toEqual([]);
  });
});
