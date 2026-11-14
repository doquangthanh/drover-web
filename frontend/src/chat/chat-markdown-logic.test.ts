import { describe, expect, it } from "vitest";
import { parseBlocks, parseInline } from "./chat-markdown-logic";

describe("inline", () => {
  it("finds code, bold, italic and links in order", () => {
    expect(parseInline("use `npm test` and **run** it *now* see [docs](https://x.dev)")).toEqual([
      { t: "text", text: "use " }, { t: "code", text: "npm test" }, { t: "text", text: " and " }, { t: "bold", text: "run" },
      { t: "text", text: " it " }, { t: "italic", text: "now" }, { t: "text", text: " see " }, { t: "link", text: "docs", href: "https://x.dev" },
    ]);
  });
  it("never makes a clickable link from javascript: or other schemes", () => {
    expect(parseInline("[x](javascript:alert(1))").some((p) => p.t === "link")).toBe(false);
    expect(parseInline("[x](data:text/html,hi)").some((p) => p.t === "link")).toBe(false);
  });
  it("leaves stray stars and snake_case alone", () => {
    expect(parseInline("2 * 3 * 4 and my_var_name")).toEqual([{ t: "text", text: "2 * 3 * 4 and my_var_name" }]);
  });
});

describe("blocks", () => {
  it("splits paragraphs on blank lines and keeps single line breaks", () => {
    const b = parseBlocks("one\ntwo\n\nthree");
    expect(b).toHaveLength(2);
    expect(b[0]).toMatchObject({ type: "para", inline: [{ t: "text", text: "one\ntwo" }] });
  });
  it("reads fenced code, also while the closing fence has not streamed in yet", () => {
    expect(parseBlocks("a\n```ts\nconst x = 1;\n```\nb")).toMatchObject([{ type: "para" }, { type: "code", lang: "ts", text: "const x = 1;" }, { type: "para" }]);
    expect(parseBlocks("```py\nprint(1)")[0]).toEqual({ type: "code", lang: "py", text: "print(1)" });
  });
  it("groups list items and tells ordered from bullets", () => {
    const b = parseBlocks("- a\n- b\n1. x\n2. y");
    expect(b).toHaveLength(2);
    expect(b[0]).toMatchObject({ type: "list", ordered: false });
    expect((b[0] as { items: unknown[] }).items).toHaveLength(2);
    expect(b[1]).toMatchObject({ type: "list", ordered: true });
  });
  it("headings and quotes", () => {
    expect(parseBlocks("## Title")[0]).toMatchObject({ type: "heading", level: 2 });
    expect(parseBlocks("> quoted")[0]).toMatchObject({ type: "quote" });
  });
  it("empty text has no blocks", () => { expect(parseBlocks("")).toEqual([]); });
});
