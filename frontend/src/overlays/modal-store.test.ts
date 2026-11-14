import { beforeEach, describe, expect, it } from "vitest";
import { confirmBox, promptText } from "./modal-dialogs";
import { closeModal, openModal, useModal } from "./modal-store";

beforeEach(() => useModal.setState({ current: null }));

describe("modal store", () => {
  it("replaces the current modal and ignores stale close ids", () => {
    const a = openModal({ title: "a" });
    const b = openModal({ title: "b" });
    closeModal(a.id);
    expect(useModal.getState().current?.id).toBe(b.id);
    closeModal(b.id);
    expect(useModal.getState().current).toBeNull();
  });

  it("handle.close closes and reports dismissal", () => {
    let dismissed = 0;
    const m = openModal({ title: "x", onClose: () => { dismissed++; } });
    m.close();
    expect(useModal.getState().current).toBeNull();
    expect(dismissed).toBe(1);
  });
});

describe("promise dialogs", () => {
  it("confirmBox resolves false when dismissed", async () => {
    const p = confirmBox("Close?", "sure", "Close", true);
    useModal.getState().current!.spec.onClose!();
    expect(await p).toBe(false);
    expect(useModal.getState().current).toBeNull();
  });

  it("promptText resolves null when dismissed and leaves a newer modal open", async () => {
    const p = promptText("Rename", "old");
    const spec = useModal.getState().current!.spec;
    const newer = openModal({ title: "newer" });
    spec.onClose!();
    expect(await p).toBeNull();
    expect(useModal.getState().current?.id).toBe(newer.id);
  });
});
