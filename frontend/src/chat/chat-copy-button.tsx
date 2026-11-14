// Copy-to-clipboard button shared by code blocks and whole chat messages.
import { useState } from "react";
import { copyText } from "../core/clipboard";

export function CopyButton({ text, className, label = "Copy" }: { text: string; className?: string; label?: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const copy = async () => {
    setState((await copyText(text)) ? "ok" : "fail");
    setTimeout(() => setState("idle"), 1200);
  };
  return <button className={className} onClick={copy} aria-label={label}>{state === "ok" ? "Copied" : state === "fail" ? "Failed" : label}</button>;
}
