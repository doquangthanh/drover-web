import { describe, expect, it } from "vitest";
import { imageType } from "./chat-images";

describe("imageType", () => {
  it("accepts png, jpeg, gif and webp by mime type or by file name", () => {
    expect(imageType({ type: "image/png", name: "" })).toBe("image/png");
    expect(imageType({ type: "", name: "Shot.JPEG" })).toBe("image/jpeg");
    expect(imageType({ type: "", name: "a.jpg" })).toBe("image/jpeg");
    expect(imageType({ type: "", name: "a.webp" })).toBe("image/webp");
    expect(imageType({ type: "image/gif", name: "x" })).toBe("image/gif");
  });
  it("rejects everything else", () => {
    expect(imageType({ type: "image/svg+xml", name: "a.svg" })).toBeNull();
    expect(imageType({ type: "application/pdf", name: "a.pdf" })).toBeNull();
    expect(imageType({ type: "", name: "noext" })).toBeNull();
  });
});
