import { describe, expect, it } from "vitest";
import { commentKey, commentsByLine, lineTarget, noReviewSupport, progressText, sendLabel, unplacedComments, type ReviewComment, type ReviewHunk } from "./review-logic";

const c = (id: string, side: "old" | "new", line: number, status = "open"): ReviewComment => ({ id, file: "a.py", side, line, anchor: "", text: id, status, created_at: 0, sent_at: null });
const hunk: ReviewHunk = { index: 0, header: "@@", hash: "h", reviewed: false, lines: [
  { k: " ", o: 1, n: 1, t: "a" }, { k: "-", o: 2, n: null, t: "b" }, { k: "+", o: null, n: 2, t: "B" },
] };

describe("lineTarget", () => {
  it("puts removed lines on the old side and everything else on the new side", () => {
    expect(lineTarget(hunk.lines[1])).toEqual({ side: "old", line: 2 });
    expect(lineTarget(hunk.lines[2])).toEqual({ side: "new", line: 2 });
    expect(lineTarget(hunk.lines[0])).toEqual({ side: "new", line: 1 });
    expect(lineTarget({ k: "-", o: null, n: null, t: "" })).toBeNull();
  });
});

describe("comment placement", () => {
  it("groups by side and line, keeps resolved ones, and leaves outdated and off-diff ones for the side list", () => {
    const all = [c("1", "new", 2), c("2", "old", 2), c("3", "new", 2, "resolved"), c("4", "new", 9), c("5", "new", 1, "outdated")];
    const by = commentsByLine(all);
    expect(by.get(commentKey("new", 2))?.map((x) => x.id)).toEqual(["1", "3"]);
    expect(by.get(commentKey("old", 2))?.map((x) => x.id)).toEqual(["2"]);
    expect(by.has(commentKey("new", 1))).toBe(false);
    expect(unplacedComments(all, [hunk]).map((x) => x.id)).toEqual(["4", "5"]);
  });
});

describe("texts", () => {
  it("says progress and the send button", () => {
    expect(progressText({ hunks: 4, reviewed: 1, open_comments: 0 })).toBe("1/4 hunks reviewed");
    expect(progressText({ hunks: 4, reviewed: 4, open_comments: 1 })).toBe("4/4 hunks reviewed · 1 open comment");
    expect(progressText({ hunks: 4, reviewed: 4, open_comments: 3 })).toContain("3 open comments");
    expect(progressText(null)).toBe("");
    expect(sendLabel(1)).toBe("Send 1 comment to the agent");
    expect(sendLabel(3)).toBe("Send 3 comments to the agent");
  });
  it("recognises a daemon without the methods", () => {
    expect(noReviewSupport(new Error("unknown method review.diff"))).toBe(true);
    expect(noReviewSupport(new Error("not a git repository"))).toBe(false);
  });
});
