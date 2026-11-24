import { describe, expect, it } from "vitest";
import { checkBadge, checkForFolder, checkForPane, folderKey } from "./checks-logic";
import type { CheckSummary } from "./protocol-types";

const run = (o: Partial<CheckSummary>): CheckSummary => ({ cwd: "/w", pane: null, status: "passed", started_at: 1, finished_at: 2, total: 2, passed: 2, failed: 0, ...o });

describe("folderKey", () => {
  it("matches the daemon's key whatever the spelling", () => {
    expect(folderKey("C:\\Users\\Me\\Repo\\")).toBe("c:/users/me/repo");
    expect(folderKey("//?/C:/Users/Me/Repo")).toBe("c:/users/me/repo");
    expect(folderKey("/home/Me/Repo/")).toBe("/home/Me/Repo"); // Linux paths keep their case
  });
});

describe("checkForPane", () => {
  it("prefers the run its own pane started, newest first", () => {
    const checks = { a: run({ cwd: "/a", pane: "%1", started_at: 5 }), b: run({ cwd: "/b", pane: "%1", started_at: 9 }), c: run({ cwd: "/c", pane: "%2", started_at: 99 }) };
    expect(checkForPane(checks, { id: "%1", cwd: "/c" })).toBe(checks.b);
  });
  it("falls back to the folder, and to nothing", () => {
    const checks = { a: run({ cwd: "c:/work/repo", pane: null }) };
    expect(checkForPane(checks, { id: "%9", cwd: "C:\\Work\\Repo" })).toBe(checks.a);
    expect(checkForPane(checks, { id: "%9", cwd: "/elsewhere" })).toBeUndefined();
    expect(checkForPane(undefined, { id: "%1" })).toBeUndefined();
  });
});

describe("checkForFolder", () => {
  it("finds a worktree's run", () => {
    const checks = { a: run({ cwd: "c:/work/repo-wt/auth" }) };
    expect(checkForFolder(checks, "C:\\work\\repo-wt\\auth")).toBe(checks.a);
  });
});

describe("checkBadge", () => {
  it("says passed, failed and running, and hides a cancelled run", () => {
    expect(checkBadge(run({}))).toMatchObject({ tone: "ok" });
    const failed = checkBadge(run({ status: "failed", failed: 1, passed: 1, steps: [{ name: "lint", status: "passed" }, { name: "test", status: "failed" }] }));
    expect(failed).toMatchObject({ tone: "bad", text: "✗ 1/2" });
    expect(failed?.title).toContain("test");
    expect(checkBadge(run({ status: "running", passed: 1 }))).toMatchObject({ tone: "info", text: "checks…" });
    expect(checkBadge(run({ status: "cancelled" }))).toBeNull();
    expect(checkBadge(undefined)).toBeNull();
  });
});
