// Key-chip layout for the shortcuts sheet (pure).
const ARROWS: Record<string, string> = { ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓" };

export interface KeyPart { text: string; chip: boolean }

/** "Go to tab 1–9" -> text "Go to tab" with chips [1] – [9]; "Answer prompt (then 1–3)" prefixes the key chip. */
export function shortcutChips(key: string, label: string): { text: string; keys: KeyPart[] } {
  const m = /^(.*?)\s*(?:\(then )?(1–[39])\)?$/.exec(label);
  if (!m) return { text: label, keys: [{ text: ARROWS[key] || key, chip: true }] };
  const [from, to] = m[2].split("–");
  const range: KeyPart[] = [{ text: from, chip: true }, { text: "–", chip: false }, { text: to, chip: true }];
  return { text: m[1], keys: key === "1" ? range : [{ text: key, chip: true }, ...range] };
}
